import { NextResponse, type NextRequest } from "next/server";
import { getAuthConfig, revokeRefreshToken } from "@/lib/server/oauth";
import { clearSessionCookies, COOKIE, isSameOriginRequest, siteOrigin } from "@/lib/server/session";

// POST /api/auth/logout(ヘッダーのフォームから送る)
// GET にしないのは、<Link> のプリフェッチや埋め込み画像で勝手にログアウトさせないため。
// クッキーを消してリフレッシュトークンを失効させ、Cognito 側のセッションも切ってからトップへ戻す。
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ message: "forbidden" }, { status: 403 });

  const origin = siteOrigin(request);
  const cfg = getAuthConfig();
  const refreshToken = request.cookies.get(COOKIE.refresh)?.value;
  if (cfg && refreshToken) {
    await revokeRefreshToken(cfg, refreshToken).catch((error: unknown) => {
      console.warn("[auth/logout] revoke failed", error);
    });
  }

  const target = cfg
    ? `${cfg.domain}/logout?${new URLSearchParams({ client_id: cfg.clientId, logout_uri: `${origin}/` })}`
    : `${origin}/`;
  // 303: フォームの POST の後を GET で遷移させる
  const res = NextResponse.redirect(target, 303);
  clearSessionCookies(res.cookies);
  return res;
}
