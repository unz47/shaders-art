#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { GithubDeployStack } from "../lib/github-deploy-stack.ts";

// GitHub Actions のデプロイ用ロールだけを作るアプリ。手元から 1 回だけ:
//   pnpm cdk --app "node bin/github-deploy.ts" deploy ShadersArtGithubDeployStack
const app = new App();

new GithubDeployStack(app, "ShadersArtGithubDeployStack", {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: "ap-northeast-1" },
  repository: "unz47/shaders-art",
  environment: "production",
});
