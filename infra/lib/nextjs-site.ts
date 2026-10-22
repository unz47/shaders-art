import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Duration, Stack } from "aws-cdk-lib";
import type { Table } from "aws-cdk-lib/aws-dynamodb";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { FunctionUrlAuthType } from "aws-cdk-lib/aws-lambda";
import { Nextjs } from "cdk-nextjs-standalone";
import { Construct } from "constructs";
import { AI_MODELS } from "../../src/lib/aiModels.ts";
import type { Auth } from "./auth.ts";

export interface NextjsSiteProps {
  /** 作品データを読み書きするDynamoDBテーブル。Route Handler(SSR Lambda)から直接アクセスする */
  table: Table;
  /** WafStack(us-east-1)で作った Web ACL の ARN。クロスリージョンで受け取る */
  webAclArn: string;
  /** ログイン(Cognito)。Route Handler がトークン交換と検証に使う */
  auth: Auth;
  /** 本番サイトのオリジン。決まっていれば OAuth の redirect_uri に使う(Auth の siteUrl と同じ値) */
  siteUrl?: string;
  /** Claude Platform on AWS のワークスペース ID(wrkspc_…、東京に作ったもの)。無ければ Claude は選べない */
  claudeWorkspaceId?: string;
}

// AI と作る で使う Bedrock の既定のモデル(利用者がパネルで選ばなかったとき)。リージョンは Lambda と同じ東京。
// 利用者が選べるモデルは src/lib/aiModels.ts の一覧で、Lambda にはその全部の呼び出しを許す。
// このアカウントでは Bedrock の Claude に制限があり(Messages API の bedrock-mantle は全部 403、InvokeModel で
// 使えるのは Sonnet 4.6 と Haiku 4.5 だけ。解除は AWS サポートに依頼する)、いまはコードに強い Qwen3 Coder にしている。
// 呼び方の違いは src/lib/server/ai.ts。
const AI_MODEL = "qwen.qwen3-coder-480b-a35b-v1:0";

// 日本国内で処理する推論プロファイル(jp.)の行き先。プロファイルを通すと、このどちらかで推論する
const JP_PROFILE_REGIONS = ["ap-northeast-1", "ap-northeast-3"];

// SSR(OpenNext)でNext.jsアプリ全体(ページ+API)をデプロイする。
// cdk-nextjs-standaloneのNextjsコンストラクトが、S3(静的アセット)+
// Lambda Function URL(SSR/API) + CloudFrontの配線を内部でやってくれる
// (旧WorksApi + Edgeが手組みしていたものの置き換え)。
export class NextjsSite extends Construct {
  readonly nextjs: Nextjs;

  constructor(scope: Construct, id: string, props: NextjsSiteProps) {
    super(scope, id);
    const { table, webAclArn, auth, siteUrl, claudeWorkspaceId } = props;

    const dirname = path.dirname(fileURLToPath(import.meta.url));
    this.nextjs = new Nextjs(this, "Nextjs", {
      // infra/lib -> infra -> リポジトリルート(Next.jsアプリ本体)
      nextjsPath: path.resolve(dirname, "../.."),
      // コンストラクトの既定値と同じだが、意図を明示するために書いておく。
      // OpenNext v3系がNext.js 16に対応している。ルートのpackage.jsonには
      // OpenNextを入れない(ここで使うのはnpx経由のこのバージョンだけ)。
      buildCommand: "npx --yes @opennextjs/aws@^3 build",
      // AI と作る(POST /api/ai/edit)の返答を少しずつ返すため、Function URL の応答をストリーミングにする。
      // OpenNext 側もストリーミング用のラッパーにする必要がある(リポジトリ直下の open-next.config.ts)。
      streaming: true,
      // ここに書いた値はビルド時と実行時(Lambda の環境変数)の両方に渡る。
      // NEXT_PUBLIC_ 以外のトークン値はビルド時には未解決の文字列になるので、
      // サーバー側のコードはモジュール読み込み時ではなくリクエスト時に読むこと。
      environment: {
        TABLE_NAME: table.tableName,
        // 作品APIはこのLambda自身のRoute Handler(/api)なので相対パスで叩く。
        // .env には旧API Gateway時代の NEXT_PUBLIC_API_BASE が残っている可能性があり、
        // ここで渡した値はビルド時に .env より優先されるので、クライアントバンドルに
        // 旧ホストが焼き込まれるのを防ぐ。
        NEXT_PUBLIC_API_BASE: "/api",
        COGNITO_USER_POOL_ID: auth.userPool.userPoolId,
        COGNITO_CLIENT_ID: auth.client.userPoolClientId,
        COGNITO_DOMAIN: auth.domainUrl,
        ...(siteUrl ? { SITE_URL: siteUrl } : {}),
        AI_MODEL,
        ...(claudeWorkspaceId ? { ANTHROPIC_AWS_WORKSPACE_ID: claudeWorkspaceId } : {}),
      },
      overrides: {
        nextjsServer: {
          functionProps: {
            // 既定の 10 秒では AI の返答(考える時間を含む)が間に合わない
            timeout: Duration.minutes(2),
          },
        },
        nextjsDistribution: {
          distributionProps: {
            webAclId: webAclArn,
          },
        },
        nextjs: {
          // Function URL を IAM 認証にして、CloudFront(+ WAF)を通らない直接アクセスを拒否する。
          // 既定の NONE だと URL を知っていれば誰でも Lambda を直接叩けて WAF を素通りできる。
          // CloudFront 側では Lambda@Edge(us-east-1)が本文込みで SigV4 署名するので、
          // POST(投稿)もそのまま通る。本文は 1 MB まで(投稿は数 KB なので足りる)。
          nextjsDistributionProps: {
            functionUrlAuthType: FunctionUrlAuthType.AWS_IAM,
          },
        },
      },
    });

    // SSR Lambda(Route Handler)から作品を読む + 投稿(PutItem)とお気に入りを書ける。
    // お気に入りは、同じ表のお気に入りの行の追加・削除(PutItem・DeleteItem)と、作品の行の
    // favoriteCount の増減(UpdateItem)を 1 つのトランザクションで行う(src/lib/server/favorites.ts)。
    // 作品の更新・削除の API はまだ無い。
    const fn = this.nextjs.serverFunction.lambdaFunction;
    table.grantReadData(fn);
    table.grant(fn, "dynamodb:PutItem", "dynamodb:DeleteItem", "dynamodb:UpdateItem");

    // AI と作る: anthropic.* の Claude は Messages API(bedrock-mantle)、jp.anthropic.* の Claude は InvokeModel、
    // それ以外は Converse API(どちらも bedrock-runtime)で呼ぶ。
    if (AI_MODEL.startsWith("anthropic.")) {
      // CreateInference をどのリソースで絞れるかは AWS のドキュメント間で食い違っているので、アクションだけに絞る
      fn.addToRolePolicy(new PolicyStatement({ actions: ["bedrock-mantle:CreateInference"], resources: ["*"] }));
    }
    // 利用者が選べるモデル(と既定のモデル)だけを呼べるようにする
    const converseModels = [
      ...new Set([AI_MODEL, ...AI_MODELS.filter((model) => model.via === "bedrock").map((model) => model.id)]),
    ].filter((id) => !id.startsWith("anthropic."));
    fn.addToRolePolicy(
      new PolicyStatement({
        actions: ["bedrock:InvokeModelWithResponseStream"],
        resources: converseModels.map((id) => `arn:aws:bedrock:${Stack.of(this).region}::foundation-model/${id}`),
      }),
    );
    // Claude(Bedrock の InvokeModel)は推論プロファイル(jp.)を通して呼ぶので、プロファイルと、
    // その行き先の各リージョンの基盤モデルの両方に許可が要る
    const profileModels = AI_MODELS.filter((model) => model.via === "bedrock-claude").map((model) => model.id);
    if (profileModels.length > 0) {
      const { region, account } = Stack.of(this);
      fn.addToRolePolicy(
        new PolicyStatement({
          actions: ["bedrock:InvokeModelWithResponseStream"],
          resources: profileModels.flatMap((id) => [
            `arn:aws:bedrock:${region}:${account}:inference-profile/${id}`,
            ...JP_PROFILE_REGIONS.map((r) => `arn:aws:bedrock:${r}::foundation-model/${id.replace(/^jp\./, "")}`),
          ]),
        }),
      );
    }
    // Claude(Claude Platform on AWS)は、設定したワークスペースでの推論だけを許す
    if (claudeWorkspaceId) {
      const { region, account } = Stack.of(this);
      fn.addToRolePolicy(
        new PolicyStatement({
          actions: ["aws-external-anthropic:CreateInference"],
          resources: [`arn:aws:aws-external-anthropic:${region}:${account}:workspace/${claudeWorkspaceId}`],
        }),
      );
    }
  }
}
