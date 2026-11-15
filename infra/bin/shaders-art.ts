#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { ShadersArtStack } from "../lib/shaders-art-stack.ts";
import { WafStack } from "../lib/waf-stack.ts";

const app = new App();

// 独自ドメイン(cdk.json の context "domainName"、例: shaders.art)。空ならドメインを当てず、
// CloudFront のドメイン(dxxxx.cloudfront.net)のまま配信する。README の「独自ドメイン」を参照
const domainName = parseDomainName(app.node.tryGetContext("domainName"));

// WAF(CLOUDFRONT スコープ)と証明書は us-east-1 でしか作れない。本体は利用者に近い
// ap-northeast-1(東京)に置き、ARN だけをクロスリージョンで受け取る。
// 両方のスタックに crossRegionReferences が要る。ホストゾーンを引く(fromLookup)には account も要る。
const waf = new WafStack(app, "ShadersArtWafStack", {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-1" },
  crossRegionReferences: true,
  domainName,
});

// account は Function URL の IAM 認証に要る。署名用の Lambda@Edge が us-east-1 の別スタックに
// 作られ、そこから SSR Lambda の ARN を参照するので、アカウントが決まっていないと合成できない。
// CDK_DEFAULT_ACCOUNT は cdk CLI が今の認証情報から入れる。
new ShadersArtStack(app, "ShadersArtStack", {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: "ap-northeast-1" },
  crossRegionReferences: true,
  webAclArn: waf.webAcl.attrArn,
  domainName,
  certificate: waf.certificate,
});

function parseDomainName(value: unknown): string | undefined {
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string" || !/^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(value)) {
    throw new Error(`context "domainName" は "example.com" の形(小文字、https:// や末尾のドット無し)で指定してください: ${String(value)}`);
  }
  return value;
}
