import { NextResponse, type NextRequest } from "next/server";
import { addFavorite, removeFavorite } from "@/lib/server/favorites";
import { getSession, isSameOriginRequest } from "@/lib/server/session";
import { getDictionary } from "@/lib/i18n/server";

// POST   /api/works/:slug/favorite(要ログイン)→ { favorited: true, favoriteCount }
// DELETE /api/works/:slug/favorite(要ログイン)→ { favorited: false, favoriteCount }
// 何度送っても同じ結果になる(すでにお気に入りなら POST しても増えない)。
// 作品が無い・他人の非公開作品なら 404。
const NO_STORE = { "Cache-Control": "private, no-store" };

async function handle(request: NextRequest, slug: string, on: boolean) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ message: "forbidden" }, { status: 403 });
  const session = await getSession();
  if (!session) return NextResponse.json({ message: (await getDictionary()).api.loginForFavorites }, { status: 401, headers: NO_STORE });
  const result = on ? await addFavorite(session.sub, slug) : await removeFavorite(session.sub, slug);
  if (!result) return NextResponse.json({ message: "not found" }, { status: 404, headers: NO_STORE });
  return NextResponse.json(result, { headers: NO_STORE });
}

export async function POST(request: NextRequest, ctx: RouteContext<"/api/works/[slug]/favorite">) {
  return handle(request, (await ctx.params).slug, true);
}

export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/works/[slug]/favorite">) {
  return handle(request, (await ctx.params).slug, false);
}
