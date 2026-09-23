import { CfnOutput, Stack, type StackProps } from "aws-cdk-lib";
import type { Construct } from "constructs";
import { Edge } from "./edge.ts";
import { WorksApi } from "./works-api.ts";
import { WorksTable } from "./works-table.ts";

// 構成: 利用者 → CloudFront(+ WAF) → HttpApi(API Gateway v2) → Lambda → DynamoDB
// server/(ローカル Node + SQLite 版)・infra の SST 案と同じ API 契約
// (GET /api/works?tab=, GET /api/works/:slug)を実装する。
// 各部品(テーブル・API・エッジ)の中身は lib/ 配下の Construct に分けてあり、
// ここは組み立てるだけ。
export class ShadersArtStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const { table } = new WorksTable(this, "WorksTable");
    const { api } = new WorksApi(this, "WorksApi", { table });
    const { distribution } = new Edge(this, "Edge", { api });

    new CfnOutput(this, "ApiUrl", { value: api.apiEndpoint });
    new CfnOutput(this, "EdgeUrl", { value: `https://${distribution.distributionDomainName}` });
    new CfnOutput(this, "TableName", { value: table.tableName });
  }
}
