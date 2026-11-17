#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { GithubDeployStack } from "../lib/github-deploy-stack.ts";

// GitHub Actions のデプロイ用ロールだけを作るアプリ。手元から 1 回だけ:
//   pnpm cdk --app "node bin/github-deploy.ts" deploy ShadersArtGithubDeployStack
const app = new App();

new GithubDeployStack(app, "ShadersArtGithubDeployStack", {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: "ap-northeast-1" },
  // このリポジトリの OIDC トークンの sub は、名前の後ろに ID が付く形(immutable subject)。
  // 確かめ方: gh api repos/unz47/shaders-art/actions/oidc/customization/sub の sub_claim_prefix。
  // ID まで見るので、名前を消して同じ名前で作り直されたリポジトリからは引き受けられない
  repository: "unz47@130633356/shaders-art@1371557570",
  environment: "production",
});
