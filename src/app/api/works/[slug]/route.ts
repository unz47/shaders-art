import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse, type NextRequest } from "next/server";

// infra/functions/works.ts(API Gateway + Lambda版)から移植。
// GET /api/works/:slug → Work(source を含む)、無ければ 404

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/works/[slug]">) {
  const { slug } = await ctx.params;

  const { Item } = await client.send(new GetCommand({ TableName: TABLE_NAME, Key: { slug } }));
  if (!Item) return NextResponse.json({ message: "not found" }, { status: 404 });

  return NextResponse.json(Item);
}
