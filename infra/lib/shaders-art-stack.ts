import { CfnOutput, Stack, type StackProps } from "aws-cdk-lib";
import type { Construct } from "constructs";
import { Edge } from "./edge.ts";
import { WorksApi } from "./works-api.ts";
import { WorksTable } from "./works-table.ts";

export interface ShadersArtStackProps extends StackProps {
  /** WafStack(us-east-1)の Web ACL ARN。クロスリージョンで受け取る */
  webAclArn: string;
}

// 構成: 利用者 → CloudFront(+ WAF) → HttpApi(API Gateway v2) → Lambda → DynamoDB
// 利用者に近いリージョン(ap-northeast-1)に置く。WAF だけは仕様上 us-east-1 にしか
// 作れないので WafStack に分けてあり、ここでは ARN を受け取るだけ(bin/shaders-art.ts 参照)。
// server/(ローカル Node + SQLite 版)と同じ API 契約
// (GET /api/works?tab=, GET /api/works/:slug)を実装する。
// 各部品(テーブル・API・エッジ)の中身は lib/ 配下の Construct に分けてあり、
// ここは組み立てるだけ。
export class ShadersArtStack extends Stack {
  constructor(scope: Construct, id: string, props: ShadersArtStackProps) {
    super(scope, id, props);

    const { table } = new WorksTable(this, "WorksTable");
    const { api } = new WorksApi(this, "WorksApi", { table });
    const { distribution } = new Edge(this, "Edge", { api, webAclArn: props.webAclArn });

    new CfnOutput(this, "ApiUrl", { value: api.apiEndpoint });
    new CfnOutput(this, "EdgeUrl", { value: `https://${distribution.distributionDomainName}` });
    new CfnOutput(this, "TableName", { value: table.tableName });
  }
}
