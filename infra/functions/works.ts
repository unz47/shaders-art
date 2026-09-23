import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

// server/(ローカル Node + SQLite 版)と同じ API 契約:
//   GET /api/works?tab=collection|new  → { items: WorkSummary[] }(source を含まない)
//   GET /api/works/:slug               → Work(source を含む)、無ければ 404

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;

interface WorkItem {
  slug: string;
  title: string;
  author: string;
  bytes: number;
  license: string;
  thumbnail: string;
  collected: boolean;
  createdAt: string;
  description: string;
  tags: string[];
  source: string;
}

function json(status: number, body: unknown): APIGatewayProxyResultV2 {
  return { statusCode: status, headers: { "content-type": "application/json; charset=utf-8" }, body: JSON.stringify(body) };
}

export async function list(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const tab = event.queryStringParameters?.tab ?? "collection";
  // 件数が少ないうちは Scan で十分。増えてきたら GSI を足して Query に切り替える
  const { Items } = await client.send(new ScanCommand({ TableName: TABLE_NAME }));
  const works = (Items ?? []) as WorkItem[];

  const filtered = tab === "collection" ? works.filter((w) => w.collected) : works;
  const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const items = sorted.map(({ source: _source, ...summary }) => summary);

  return json(200, { items });
}

export async function get(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const slug = event.pathParameters?.slug;
  if (!slug) return json(400, { message: "slug is required" });

  const { Item } = await client.send(new GetCommand({ TableName: TABLE_NAME, Key: { slug } }));
  if (!Item) return json(404, { message: "not found" });

  return json(200, Item);
}
