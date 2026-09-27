import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse, type NextRequest } from "next/server";
import type { Work } from "@/lib/works";

// infra/functions/works.ts(API Gateway + Lambda版)から移植。
// SSR移行に伴い、Next.jsのRoute Handlerとして同じLambda(OpenNext)の中で動かす。
// GET /api/works?tab=collection|new → { items: Work[] }(一覧もホバー再生用に source を含む)

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;

export async function GET(request: NextRequest) {
  const tab = request.nextUrl.searchParams.get("tab") ?? "collection";
  // 件数が少ないうちは Scan で十分。増えてきたら GSI を足して Query に切り替える
  const { Items } = await client.send(new ScanCommand({ TableName: TABLE_NAME }));
  const works = (Items ?? []) as Work[];

  const filtered = tab === "collection" ? works.filter((w) => w.collected) : works;
  const items = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ items });
}
