import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
// フロント側の仮データをそのまま初期データとして使う(server/, infra の SST 案と同じ考え方)
import { works } from "../../src/mocks/works/data.ts";

// 使い方: TABLE_NAME=<cdk deploy の出力にある ShadersArtStack.TableName> pnpm seed
const TABLE_NAME = process.env.TABLE_NAME;
if (!TABLE_NAME) {
  console.error("TABLE_NAME を指定してください(cdk deploy の出力の TableName)");
  process.exit(1);
}

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

for (const w of works) {
  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: w }));
  console.log(`put: ${w.slug}`);
}

console.log(`シードしました: ${works.length} 件`);
