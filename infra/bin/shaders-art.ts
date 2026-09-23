#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { ShadersArtStack } from "../lib/shaders-art-stack.ts";

const app = new App();

// WAF を CloudFront に付けるには WebACL(scope: CLOUDFRONT)が us-east-1 にある必要がある。
// クロスリージョンの参照が面倒なので、スタック全体を us-east-1 に統一している。
new ShadersArtStack(app, "ShadersArtStack", {
  env: { region: "us-east-1" },
});
