import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";
import type { Work } from "@/lib/works";
import { db, tableName, toPublicWork } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { getDictionary } from "@/lib/i18n/server";

// GET /api/me/works(要ログイン)→ { items: Work[] }
// ログイン中の人が投稿した作品を、非公開も含めて新しい順に返す(「自分の作品」ページ)。
// 人ごとに違うので CDN にキャッシュさせない。
const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: (await getDictionary()).api.loginNeeded }, { status: 401, headers: NO_STORE });

  // 件数が少ないうちは Scan で十分(/api/works と同じ)。絞り込みは読んだ後にかかるので、
  // 1 回で全件を読み切れなかったときは続きを読む。増えてきたら authorId の GSI で Query にする
  const works: Work[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const page = await db.send(
      new ScanCommand({
        TableName: tableName(),
        FilterExpression: "authorId = :sub",
        ExpressionAttributeValues: { ":sub": session.sub },
        ExclusiveStartKey: startKey,
      }),
    );
    works.push(...((page.Items ?? []) as Work[]));
    startKey = page.LastEvaluatedKey;
  } while (startKey);

  const items = works.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(toPublicWork);
  return NextResponse.json({ items }, { headers: NO_STORE });
}
