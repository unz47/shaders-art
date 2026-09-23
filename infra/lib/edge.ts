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
import { Construct } from "constructs";

export interface EdgeProps {
  api: HttpApi;
  /** WafStack(us-east-1)で作った Web ACL の ARN。クロスリージョンで受け取る */
  webAclArn: string;
}

// WAF を付けた CloudFront。HttpApi の手前に置く。WAF 自体は WafStack(us-east-1)側で
// 作っていて、ここでは ARN を受け取って貼り付けるだけ。
export class Edge extends Construct {
  readonly distribution: Distribution;

  constructor(scope: Construct, id: string, props: EdgeProps) {
    super(scope, id);
    const { api, webAclArn } = props;

    const region = Stack.of(this).region;
    const apiDomain = `${api.apiId}.execute-api.${region}.amazonaws.com`;

    // クエリ文字列(tab=collection/new)ごとに別キャッシュにしつつ、短い TTL で
    // すぐ古くなりすぎないようにする。CACHING_DISABLED は安全だが毎回オリジンまで
    // 取りに行くので遅い。CACHING_OPTIMIZED(既定)はクエリ文字列を無視するので
    // tab=collection と tab=new が同じキャッシュ扱いになってしまう
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

    // CloudFront: この Distribution に WAF(webAclArn)を貼り付け、API Gateway を転送先にする
    this.distribution = new Distribution(this, "Distribution", {
      webAclId: webAclArn,
      defaultBehavior: {
        origin: new HttpOrigin(apiDomain),
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy,
      },
    });
  }
}
