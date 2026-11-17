import { CfnOutput, Stack, type StackProps } from "aws-cdk-lib";
import { OpenIdConnectPrincipal, OpenIdConnectProvider, PolicyStatement, Role } from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";

export interface GithubDeployStackProps extends StackProps {
  /**
   * OIDC トークンの sub の repo: の後ろの部分。既定は owner/name だが、immutable subject のリポジトリでは
   * owner@<ID>/name@<ID> になる。このリポジトリの、下の environment のジョブだけが引き受けられる
   */
  repository: string;
  /** GitHub の environment 名。.github/workflows/deploy.yml の environment と同じにする */
  environment: string;
}

// GitHub Actions(.github/workflows/deploy.yml)が cdk deploy するときに引き受ける IAM ロール。
// 本体とは別のアプリ(bin/github-deploy.ts)にしてあり、`cdk deploy --all` では作り直さない。手元から 1 回だけデプロイする。
//
// このロールに直接付けるのは、CDK のブートストラップが作ったロール(cdk-hnb659fds-*: デプロイ・アセットの置き場・
// ルックアップ)を引き受ける権限だけ。ただしデプロイ用のロールを通して CloudFormation の実行ロール
// (ブートストラップの既定では AdministratorAccess)を使えるので、**実質的にアカウントの管理者と同じことができる**
// (このロール自身の書き換えも含む)。だから、このロールで動くコードを人間が読んだものだけに絞っている:
//   - 引き受けられるのは environment production のジョブだけで、production は main からしか使えない
//   - Next.js のビルド(src/ のコードが動く)は、認証情報の無い別のジョブで済ませる
//   - 認証情報のあるジョブで動く infra/ と src/lib/aiModels.ts、.github/ は、AI だけではマージされない
//     (.github/ai-review/human-required.txt)
// 権限をさらに絞るなら、ブートストラップの --cloudformation-execution-policies を必要なものだけにする。
export class GithubDeployStack extends Stack {
  constructor(scope: Construct, id: string, props: GithubDeployStackProps) {
    super(scope, id, props);

    // GitHub の OIDC プロバイダはアカウントに 1 つだけ作れる。すでにあるものを使う
    const provider = OpenIdConnectProvider.fromOpenIdConnectProviderArn(
      this,
      "GithubOidc",
      `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`,
    );

    const role = new Role(this, "DeployRole", {
      roleName: "shaders-art-github-deploy",
      // IAM の説明は ASCII と Latin-1 の文字しか使えない
      description: `cdk deploy from GitHub Actions (${props.repository}, environment ${props.environment})`,
      assumedBy: new OpenIdConnectPrincipal(provider, {
        StringEquals: {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          // environment を付けたジョブの sub は repo:<repository>:environment:<名前> になる。
          // environment 側で main ブランチからしか使えないようにしてあるので、PR やほかのブランチからは引き受けられない
          "token.actions.githubusercontent.com:sub": `repo:${props.repository}:environment:${props.environment}`,
        },
      }),
    });

    role.addToPolicy(
      new PolicyStatement({
        actions: ["sts:AssumeRole"],
        resources: [`arn:aws:iam::${this.account}:role/cdk-hnb659fds-*-role-${this.account}-*`],
      }),
    );

    new CfnOutput(this, "DeployRoleArn", { value: role.roleArn });
  }
}
