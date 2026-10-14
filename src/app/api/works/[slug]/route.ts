import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse, type NextRequest } from "next/server";
import { db, tableName, toPublicWork } from "@/lib/server/db";

// infra/functions/works.ts(API Gateway + Lambda版)から移植。
// GET /api/works/:slug → Work(source を含む)、無ければ 404

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/works/[slug]">) {
  const { slug } = await ctx.params;

  const { Item } = await db.send(new GetCommand({ TableName: tableName(), Key: { slug } }));
  if (!Item) return NextResponse.json({ message: "not found" }, { status: 404 });

  return NextResponse.json(toPublicWork(Item));
}
