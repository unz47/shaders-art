import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/moderation";
import { hideWork, restoreWork } from "@/lib/server/moderation";
import { getSession, isSameOriginRequest } from "@/lib/server/session";

// POST /api/admin/works/:slug { action: "hide" | "restore" }(運営だけ)→ 200 { ok: true }
//   hide    … 運営が非公開にする(作者が公開にしていても出さない)
//   restore … 確認して戻す。それまでの通報は片付ける
// 消すのは DELETE /api/works/:slug(運営はどの作品でも消せる)。運営でなければ 404。

export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/works/[slug]">) {
  const { slug } = await ctx.params;
  if (!isSameOriginRequest(request)) return NextResponse.json({ message: "forbidden" }, { status: 403 });
  if (!isAdmin(await getSession())) return NextResponse.json({ message: "not found" }, { status: 404 });
  // JSON 以外を受けない = 他サイトのフォームからの単純 POST を通さない
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ message: "json only" }, { status: 415 });
  }

  const body = (await request.json().catch(() => null)) as { action?: unknown } | null;
  const action = body?.action;
  if (action !== "hide" && action !== "restore") return NextResponse.json({ message: "bad request" }, { status: 400 });

  const ok = action === "hide" ? await hideWork(slug) : await restoreWork(slug);
  if (!ok) return NextResponse.json({ message: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
