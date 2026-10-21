import { CfnOutput, Stack, type StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Auth } from "./auth.ts";

/** ローカル開発で Cognito ログインを検証するための独立スタック。本番サイトには触れない。 */
export class DevAuthStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const auth = new Auth(this, "Auth", {
      domainPrefix: `shaders-art-dev-${Stack.of(this).account}`,
    });

    new CfnOutput(this, "UserPoolId", { value: auth.userPool.userPoolId });
    new CfnOutput(this, "UserPoolClientId", { value: auth.client.userPoolClientId });
    new CfnOutput(this, "CognitoDomain", { value: auth.domainUrl });
  }
}
