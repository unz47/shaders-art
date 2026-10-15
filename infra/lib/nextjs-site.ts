import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { Table } from "aws-cdk-lib/aws-dynamodb";
import { FunctionUrlAuthType } from "aws-cdk-lib/aws-lambda";
import { Nextjs } from "cdk-nextjs-standalone";
import { Construct } from "constructs";
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
}

// SSR(OpenNext)でNext.jsアプリ全体(ページ+API)をデプロイする。
// cdk-nextjs-standaloneのNextjsコンストラクトが、S3(静的アセット)+
// Lambda Function URL(SSR/API) + CloudFrontの配線を内部でやってくれる
// (旧WorksApi + Edgeが手組みしていたものの置き換え)。
export class NextjsSite extends Construct {
  readonly nextjs: Nextjs;

  constructor(scope: Construct, id: string, props: NextjsSiteProps) {
    super(scope, id);
    const { table, webAclArn, auth, siteUrl } = props;

    const dirname = path.dirname(fileURLToPath(import.meta.url));
    this.nextjs = new Nextjs(this, "Nextjs", {
      // infra/lib -> infra -> リポジトリルート(Next.jsアプリ本体)
      nextjsPath: path.resolve(dirname, "../.."),
      // コンストラクトの既定値と同じだが、意図を明示するために書いておく。
      // OpenNext v3系がNext.js 16に対応している。ルートのpackage.jsonには
      // OpenNextを入れない(ここで使うのはnpx経由のこのバージョンだけ)。
      buildCommand: "npx --yes @opennextjs/aws@^3 build",
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
      },
      overrides: {
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

    // SSR Lambda(Route Handler)から作品を読む + 投稿(PutItem)だけ書ける。
    // 更新・削除はまだ API が無いので権限も渡さない。
    const fn = this.nextjs.serverFunction.lambdaFunction;
    table.grantReadData(fn);
    table.grant(fn, "dynamodb:PutItem");
  }
}
