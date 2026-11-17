import { NextResponse, type NextRequest } from "next/server";
import { getDictionary } from "@/lib/i18n/server";
import { validateReport } from "@/lib/moderation";
import { addReport } from "@/lib/server/moderation";
import { getSession, isSameOriginRequest } from "@/lib/server/session";

// POST /api/works/:slug/report { reason, note? }(要ログイン)→ 200 { reported: true }
// 1 人が同じ作品を通報できるのは 1 回(2 回目も 200 で、何も変えない)。自分の作品は通報できない。
// 別々の人からの通報がしきい値に達すると、運営が見るまで自動で非公開になる(lib/server/moderation)。

export async function POST(request: NextRequest, ctx: RouteContext<"/api/works/[slug]/report">) {
  const { slug } = await ctx.params;
  const t = await getDictionary();
  if (!isSameOriginRequest(request)) return NextResponse.json({ message: "forbidden" }, { status: 403 });
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ message: t.api.jsonOnly }, { status: 415 });
  }
  const session = await getSession();
  if (!session) return NextResponse.json({ message: t.api.loginToReport }, { status: 401 });

  const input = validateReport(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ message: t.api.badRequest }, { status: 400 });

  switch (await addReport(session.sub, slug, input)) {
    case "reported":
    case "already":
      return NextResponse.json({ reported: true });
    case "own":
      return NextResponse.json({ message: t.api.cannotReportOwn }, { status: 400 });
    case "not-found":
      return NextResponse.json({ message: "not found" }, { status: 404 });
  }
}
