#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { DevAuthStack } from "../lib/dev-auth-stack.ts";

const app = new App();

new DevAuthStack(app, "ShadersArtDevAuthStack", {
  env: { region: "ap-northeast-1" },
});
