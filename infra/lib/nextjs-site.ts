import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { Table } from "aws-cdk-lib/aws-dynamodb";
import { Nextjs } from "cdk-nextjs-standalone";
import { Construct } from "constructs";

export interface NextjsSiteProps {
  /** 作品データを読み書きするDynamoDBテーブル。Route Handler(SSR Lambda)から直接アクセスする */
  table: Table;
  /** WafStack(us-east-1)で作った Web ACL の ARN。クロスリージョンで受け取る */
  webAclArn: string;
}

// SSR(OpenNext)でNext.jsアプリ全体(ページ+API)をデプロイする。
// cdk-nextjs-standaloneのNextjsコンストラクトが、S3(静的アセット)+
// Lambda Function URL(SSR/API) + CloudFrontの配線を内部でやってくれる
// (旧WorksApi + Edgeが手組みしていたものの置き換え)。
export class NextjsSite extends Construct {
  readonly nextjs: Nextjs;

  constructor(scope: Construct, id: string, props: NextjsSiteProps) {
    super(scope, id);
    const { table, webAclArn } = props;

    const dirname = path.dirname(fileURLToPath(import.meta.url));
    this.nextjs = new Nextjs(this, "Nextjs", {
      // infra/lib -> infra -> リポジトリルート(Next.jsアプリ本体)
      nextjsPath: path.resolve(dirname, "../.."),
      // コンストラクトの既定値と同じだが、意図を明示するために書いておく。
      // OpenNext v3系がNext.js 16に対応している。ルートのpackage.jsonには
      // OpenNextを入れない(ここで使うのはnpx経由のこのバージョンだけ)。
      buildCommand: "npx --yes @opennextjs/aws@^3 build",
      environment: {
        TABLE_NAME: table.tableName,
        // 作品APIはこのLambda自身のRoute Handler(/api)なので相対パスで叩く。
        // .env には旧API Gateway時代の NEXT_PUBLIC_API_BASE が残っている可能性があり、
        // ここで渡した値はビルド時に .env より優先されるので、クライアントバンドルに
        // 旧ホストが焼き込まれるのを防ぐ。
        NEXT_PUBLIC_API_BASE: "/api",
      },
      overrides: {
        nextjsDistribution: {
          distributionProps: {
            webAclId: webAclArn,
          },
        },
      },
    });

    // SSR Lambda(Route Handler)からDynamoDBを読めるようにする。
    // 投稿API(POST)を足すときに grantReadWriteData に広げる。
    table.grantReadData(this.nextjs.serverFunction.lambdaFunction);
  }
}
