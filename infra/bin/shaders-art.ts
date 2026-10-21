#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { ShadersArtStack } from "../lib/shaders-art-stack.ts";
import { WafStack } from "../lib/waf-stack.ts";

const app = new App();

// WAF(CLOUDFRONT スコープ)は us-east-1 でしか作れない。本体は利用者に近い
// ap-northeast-1(東京)に置き、WAF の ARN だけをクロスリージョンで受け取る。
// 両方のスタックに crossRegionReferences が要る。
const waf = new WafStack(app, "ShadersArtWafStack", {
  env: { region: "us-east-1" },
  crossRegionReferences: true,
});

// account は Function URL の IAM 認証に要る。署名用の Lambda@Edge が us-east-1 の別スタックに
// 作られ、そこから SSR Lambda の ARN を参照するので、アカウントが決まっていないと合成できない。
// CDK_DEFAULT_ACCOUNT は cdk CLI が今の認証情報から入れる。
new ShadersArtStack(app, "ShadersArtStack", {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: "ap-northeast-1" },
  crossRegionReferences: true,
  webAclArn: waf.webAcl.attrArn,
});
