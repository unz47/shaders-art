import { CfnOutput, Stack, type StackProps } from "aws-cdk-lib";
import { CfnWebACL } from "aws-cdk-lib/aws-wafv2";
import type { Construct } from "constructs";

// WAF(CLOUDFRONT スコープ)は us-east-1 でしか作れない。
// 本体(ShadersArtStack)は利用者に近い ap-northeast-1(東京)に置きたいので、
// WAF だけをこの独立したスタックに分け、ARN をクロスリージョンで渡す。
export class WafStack extends Stack {
  readonly webAcl: CfnWebACL;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.webAcl = new CfnWebACL(this, "Waf", {
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

    new CfnOutput(this, "WebAclArn", { value: this.webAcl.attrArn });
  }
}
