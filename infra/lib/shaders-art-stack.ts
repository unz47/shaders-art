import { CfnOutput, Stack, type StackProps } from "aws-cdk-lib";
import type { Construct } from "constructs";
import { NextjsSite } from "./nextjs-site.ts";
import { WorksTable } from "./works-table.ts";

export interface ShadersArtStackProps extends StackProps {
  /** WafStack(us-east-1)の Web ACL ARN。クロスリージョンで受け取る */
  webAclArn: string;
}

// 構成: 利用者 → CloudFront(+ WAF) → Lambda(SSR, Next.js本体 + Route Handler) → DynamoDB
// 利用者に近いリージョン(ap-northeast-1)に置く。WAF だけは仕様上 us-east-1 にしか
// 作れないので WafStack に分けてあり、ここでは ARN を受け取るだけ(bin/shaders-art.ts 参照)。
// 以前はAPI Gateway + 専用Lambdaで作品APIだけ別サーバーにしていたが、
// SSR移行に伴いNext.jsのRoute Handlerに統合し、SSRと同じLambdaで動かす
// (詳細はNotionの設計判断欄)。
export class ShadersArtStack extends Stack {
  constructor(scope: Construct, id: string, props: ShadersArtStackProps) {
    super(scope, id, props);

    const { table } = new WorksTable(this, "WorksTable");
    const { nextjs } = new NextjsSite(this, "Site", { table, webAclArn: props.webAclArn });

    new CfnOutput(this, "SiteUrl", { value: nextjs.url });
    new CfnOutput(this, "TableName", { value: table.tableName });
  }
}
