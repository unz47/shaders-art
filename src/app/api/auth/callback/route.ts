import { NextResponse, type NextRequest } from "next/server";
import { decodePendingLogin, getAuthConfig, requestTokens } from "@/lib/server/oauth";
import { COOKIE, PENDING_COOKIE_PATH, setSessionCookies, siteOrigin, verifyIdToken } from "@/lib/server/session";

// GET /api/auth/callback?code=...&state=... ← Cognito の Hosted UI から戻ってくる
// 認可コードをトークンに交換し、ID トークンを検証してから httpOnly クッキーに入れる。
export async function GET(request: NextRequest) {
  const origin = siteOrigin(request);
  const cfg = getAuthConfig();
  const pending = decodePendingLogin(request.cookies.get(COOKIE.pending)?.value);
  const params = request.nextUrl.searchParams;
  const code = params.get("code");

  const fail = (reason: string) => {
    const res = NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(reason)}`, origin));
    res.cookies.delete({ name: COOKIE.pending, path: PENDING_COOKIE_PATH });
    return res;
  };

  if (!cfg) return fail("not_configured");
  // ユーザーが Hosted UI でキャンセルした場合など
  if (params.get("error")) return fail(params.get("error") ?? "error");
  if (!pending || !code || params.get("state") !== pending.state) return fail("invalid_state");

  try {
    const tokens = await requestTokens(cfg, {
      grant_type: "authorization_code",
      code,
      redirect_uri: `${origin}/api/auth/callback`,
      code_verifier: pending.verifier,
    });
    await verifyIdToken(cfg, tokens.id_token);

    const res = NextResponse.redirect(new URL(pending.returnTo, origin));
    setSessionCookies(res.cookies, tokens);
    res.cookies.delete({ name: COOKIE.pending, path: PENDING_COOKIE_PATH });
    return res;
  } catch (error) {
    console.error("[auth/callback] token exchange failed", error);
    return fail("token_exchange_failed");
  }
}
