import { NextResponse, type NextRequest } from "next/server";
import { getDictionary } from "@/lib/i18n/server";
import { isAdmin, isPublicWork } from "@/lib/moderation";
import { toPublicWork } from "@/lib/server/db";
import { deleteWork, getWorkRow, hasReported, setVisibility } from "@/lib/server/moderation";
import { getSession, isSameOriginRequest } from "@/lib/server/session";

// infra/functions/works.ts(API Gateway + Lambda版)から移植。
// GET    /api/works/:slug → Work(source を含む)+ viewer(見ている人との関係)、無ければ 404
// PATCH  /api/works/:slug { visibility: "public" | "private" }(作者だけ)→ 200 { visibility }
// DELETE /api/works/:slug(作者か運営)→ 204
// 見ている人によって返す中身が変わるので、CDN にキャッシュさせない。
const NO_STORE = { "Cache-Control": "private, no-store" };

const notFound = () => NextResponse.json({ message: "not found" }, { status: 404, headers: NO_STORE });

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/works/[slug]">) {
  const { slug } = await ctx.params;

  // お気に入りや通報の行も同じ表にあるが、getWorkRow は作品の行だけを返す
  const item = await getWorkRow(slug);
  if (!item) return notFound();

  // 古い作品(visibility 未設定)は公開扱い。非公開の作品(作者が非公開にした・運営や通報で非公開になった)は、
  // 作者と運営以外には存在を知らせない
  const session = await getSession();
  const owner = session !== null && session.sub === item.authorId;
  const admin = isAdmin(session);
  if (!isPublicWork(item) && !owner && !admin) return notFound();

  const reported = session !== null && !owner ? await hasReported(session.sub, slug) : false;
  return NextResponse.json(
    { ...toPublicWork(item), viewer: { signedIn: session !== null, owner, admin, reported } },
    { headers: NO_STORE },
  );
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/works/[slug]">) {
  const { slug } = await ctx.params;
  const t = await getDictionary();
  if (!isSameOriginRequest(request)) return NextResponse.json({ message: "forbidden" }, { status: 403 });
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ message: t.api.jsonOnly }, { status: 415 });
  }
  const session = await getSession();
  if (!session) return NextResponse.json({ message: t.api.loginNeeded }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { visibility?: unknown } | null;
  const visibility = body?.visibility;
  if (visibility !== "public" && visibility !== "private") {
    return NextResponse.json({ message: t.api.badRequest }, { status: 400 });
  }
  // 本人の作品でなければ、無いのと同じに扱う(他人の作品の有無を知らせない)
  if (!(await setVisibility(slug, session.sub, visibility))) return notFound();
  return NextResponse.json({ visibility }, { headers: NO_STORE });
}

export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/works/[slug]">) {
  const { slug } = await ctx.params;
  const t = await getDictionary();
  if (!isSameOriginRequest(request)) return NextResponse.json({ message: "forbidden" }, { status: 403 });
  const session = await getSession();
  if (!session) return NextResponse.json({ message: t.api.loginNeeded }, { status: 401 });

  // 運営はどの作品でも消せる。それ以外は本人の作品だけ
  const ok = await deleteWork(slug, isAdmin(session) ? undefined : session.sub);
  if (!ok) return notFound();
  return new NextResponse(null, { status: 204, headers: NO_STORE });
}
