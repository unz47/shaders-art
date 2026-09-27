import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { CfnOutput } from "aws-cdk-lib";
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
      environment: {
        TABLE_NAME: table.tableName,
      },
      overrides: {
        nextjsDistribution: {
          distributionProps: {
            webAclId: webAclArn,
          },
        },
      },
    });

    // SSR Lambda(Route Handler)からDynamoDBを読み書きできるようにする
    table.grantReadData(this.nextjs.serverFunction.lambdaFunction);

    new CfnOutput(this, "SiteUrl", { value: this.nextjs.url });
  }
}
