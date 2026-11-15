import { CfnOutput, Stack, type StackProps } from "aws-cdk-lib";
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { CfnWebACL } from "aws-cdk-lib/aws-wafv2";
import type { Construct } from "constructs";

export interface WafStackProps extends StackProps {
  /** 独自ドメイン(例: shaders.art)。あれば、その証明書もここで作る */
  domainName?: string;
}

// WAF(CLOUDFRONT スコープ)と、CloudFront に付ける証明書(ACM)は us-east-1 でしか作れない。
// 本体(ShadersArtStack)は利用者に近い ap-northeast-1(東京)に置きたいので、
// この 2 つだけをこの独立したスタックに分け、ARN をクロスリージョンで渡す。
export class WafStack extends Stack {
  readonly webAcl: CfnWebACL;
  /** domainName を渡したときだけ作る */
  readonly certificate?: Certificate;

  constructor(scope: Construct, id: string, props: WafStackProps = {}) {
    super(scope, id, props);

    if (props.domainName) {
      // DNS で検証する。ホストゾーンは Route 53 に先に作っておく(Route 53 でドメインを買えば自動で作られる)。
      // 検証用の CNAME はこのスタックが書き込むので、ホストゾーンが同じアカウントにあればデプロイだけで済む
      const hostedZone = HostedZone.fromLookup(this, "HostedZone", { domainName: props.domainName });
      this.certificate = new Certificate(this, "Certificate", {
        domainName: props.domainName,
        validation: CertificateValidation.fromDns(hostedZone),
      });
      new CfnOutput(this, "CertificateArn", { value: this.certificate.certificateArn });
    }

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
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesCommonRuleSet",
              // SizeRestrictions_BODY は本文が 8 KB を超えるリクエストを止める。作品の投稿(コードは 12 KB まで)や
              // AI と作るの依頼(コードとやりとりの履歴)は普通に超えるので、数えるだけにする。
              // 大きさはアプリ側(lib/submission・lib/aiEdit)で確かめている
              ruleActionOverrides: [{ name: "SizeRestrictions_BODY", actionToUse: { count: {} } }],
            },
          },
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
