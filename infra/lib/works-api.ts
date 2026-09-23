import { Duration } from "aws-cdk-lib";
import { CorsHttpMethod, HttpApi, HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import type { Table } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export interface WorksApiProps {
  table: Table;
}

// server/(ローカル Node + SQLite 版)と同じ API 契約:
//   GET /api/works?tab=collection|new  → { items: WorkSummary[] }
//   GET /api/works/:slug               → Work
// Lambda 2 本(list/get) + それを呼ぶ HttpApi(API Gateway v2)。
export class WorksApi extends Construct {
  readonly api: HttpApi;

  constructor(scope: Construct, id: string, props: WorksApiProps) {
    super(scope, id);
    const { table } = props;

    const commonProps = {
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      memorySize: 256,
      environment: { TABLE_NAME: table.tableName },
    };

    // Lambda: 一覧・詳細それぞれの関数を、同じファイルの違う export から作る
    const listFn = new NodejsFunction(this, "ListWorksFn", {
      ...commonProps,
      entry: "functions/works.ts",
      handler: "list",
    });
    const getFn = new NodejsFunction(this, "GetWorkFn", {
      ...commonProps,
      entry: "functions/works.ts",
      handler: "get",
    });
    table.grantReadData(listFn);
    table.grantReadData(getFn);

    // API Gateway(HTTP API)
    this.api = new HttpApi(this, "Api", {
      corsPreflight: {
        // ローカルの Next.js 開発サーバーだけ許可。本番ドメインが決まったら足す
        allowOrigins: ["http://localhost:3000", "http://localhost:3001"],
        allowMethods: [CorsHttpMethod.GET],
      },
    });
    this.api.addRoutes({
      path: "/api/works",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("ListInt", listFn),
    });
    this.api.addRoutes({
      path: "/api/works/{slug}",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("GetInt", getFn),
    });
  }
}
