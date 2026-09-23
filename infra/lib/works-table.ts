import { RemovalPolicy } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

// 作品を保存する DynamoDB テーブル。slug をキーに 1 件ずつ引く。
export class WorksTable extends Construct {
  readonly table: Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.table = new Table(this, "Table", {
      partitionKey: { name: "slug", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      // スタックを作り直したり消したりしても、作品データは残す
      removalPolicy: RemovalPolicy.RETAIN,
    });
  }
}
