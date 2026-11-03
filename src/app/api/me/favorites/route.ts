import { NextResponse } from "next/server";
import { toPublicWork } from "@/lib/server/db";
import { listFavoriteWorks } from "@/lib/server/favorites";
import { getSession } from "@/lib/server/session";

// GET /api/me/favorites(要ログイン)→ { items: Work[] }
// ログイン中の人のお気に入り(新しくお気に入りにした順)。人ごとに違うので CDN にキャッシュさせない。
const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "ログインが必要です" }, { status: 401, headers: NO_STORE });
  const items = (await listFavoriteWorks(session.sub)).map(toPublicWork);
  return NextResponse.json({ items }, { headers: NO_STORE });
}
