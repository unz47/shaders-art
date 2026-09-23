import { Duration, Stack } from "aws-cdk-lib";
import type { HttpApi } from "aws-cdk-lib/aws-apigatewayv2";
import {
  AllowedMethods,
  CacheCookieBehavior,
  CacheHeaderBehavior,
  CachePolicy,
  CacheQueryStringBehavior,
  Distribution,
} from "aws-cdk-lib/aws-cloudfront";
import { HttpOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { CfnWebACL } from "aws-cdk-lib/aws-wafv2";
import { Construct } from "constructs";

export interface EdgeProps {
  api: HttpApi;
}

// WAF(coreRuleSet + レート制限) を付けた CloudFront。HttpApi の手前に置く。
// WAF は CLOUDFRONT スコープなので us-east-1 が前提(bin/shaders-art.ts でスタック全体を固定している)。
export class Edge extends Construct {
  readonly distribution: Distribution;

  constructor(scope: Construct, id: string, props: EdgeProps) {
    super(scope, id);
    const { api } = props;

    // WAF: Web ACL(ルールの集合)
    const webAcl = new CfnWebACL(this, "Waf", {
      scope: "CLOUDFRONT",
      defaultAction: { allow: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: "shaders-art-waf",
      },
      rules: [
        {
          name: "AWSManagedRulesCommonRuleSet",
          priority: 0,
          overrideAction: { none: {} },
          statement: { managedRuleGroupStatement: { vendorName: "AWS", name: "AWSManagedRulesCommonRuleSet" } },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "commonRuleSet",
          },
        },
        {
          name: "RateLimit",
          priority: 1,
          action: { block: {} },
          statement: { rateBasedStatement: { limit: 2000, aggregateKeyType: "IP" } },
          visibilityConfig: { sampledRequestsEnabled: true, cloudWatchMetricsEnabled: true, metricName: "rateLimit" },
        },
      ],
    });

    const region = Stack.of(this).region;
    const apiDomain = `${api.apiId}.execute-api.${region}.amazonaws.com`;

    // クエリ文字列(tab=collection/new)ごとに別キャッシュにしつつ、短い TTL で
    // すぐ古くなりすぎないようにする。CACHING_DISABLED(以前の設定)は安全だが、
    // 毎回オリジンまで取りに行くので遅い。CACHING_OPTIMIZED(既定)はクエリ文字列を
    // 無視するので tab=collection と tab=new が同じキャッシュ扱いになってしまう
    const cachePolicy = new CachePolicy(this, "ApiCachePolicy", {
      comment: "作品データは短時間だけキャッシュする",
      defaultTtl: Duration.seconds(15),
      minTtl: Duration.seconds(0),
      maxTtl: Duration.seconds(60),
      queryStringBehavior: CacheQueryStringBehavior.all(),
      headerBehavior: CacheHeaderBehavior.none(),
      cookieBehavior: CacheCookieBehavior.none(),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });

    // CloudFront: この Distribution に上の Web ACL を貼り付け、API Gateway を転送先にする
    this.distribution = new Distribution(this, "Distribution", {
      webAclId: webAcl.attrArn,
      defaultBehavior: {
        origin: new HttpOrigin(apiDomain),
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy,
      },
    });
  }
}
