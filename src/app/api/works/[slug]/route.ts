import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse, type NextRequest } from "next/server";
import { db, isWorkItem, tableName, toPublicWork } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";

// infra/functions/works.ts(API Gateway + Lambda版)から移植。
// GET /api/works/:slug → Work(source を含む)、無ければ 404

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/works/[slug]">) {
  const { slug } = await ctx.params;

  const { Item } = await db.send(new GetCommand({ TableName: tableName(), Key: { slug } }));
  // お気に入りの行も同じ表にあるので、作品以外の行は返さない
  if (!Item || !isWorkItem(Item)) return NextResponse.json({ message: "not found" }, { status: 404 });

  // 古い作品(visibility 未設定)は公開扱い。非公開作品は投稿者以外に存在を知らせない。
  if (Item.visibility !== undefined && Item.visibility !== "public") {
    const session = await getSession();
    if (!session || session.sub !== Item.authorId) {
      return NextResponse.json({ message: "not found" }, { status: 404 });
    }
  }

  return NextResponse.json(toPublicWork(Item));
}
