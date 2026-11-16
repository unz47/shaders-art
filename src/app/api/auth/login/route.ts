import { NextResponse, type NextRequest } from "next/server";
import { encodePendingLogin, getAuthConfig, pkceChallenge, randomToken, safeReturnTo } from "@/lib/server/oauth";
import { COOKIE, cookieSecure, PENDING_COOKIE_PATH, siteOrigin } from "@/lib/server/session";
import { getDictionary } from "@/lib/i18n/server";

// GET /api/auth/login?returnTo=/edit → Cognito の Hosted UI へリダイレクト
// state(CSRF 対策)と PKCE の verifier は httpOnly クッキーに入れ、コールバックで照合する。
export async function GET(request: NextRequest) {
  const cfg = getAuthConfig();
  if (!cfg) return NextResponse.json({ message: (await getDictionary()).api.loginNotConfigured }, { status: 503 });

  const state = randomToken();
  const verifier = randomToken();
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));

  const authorize = new URL(`${cfg.domain}/oauth2/authorize`);
  authorize.search = new URLSearchParams({
    response_type: "code",
    client_id: cfg.clientId,
    redirect_uri: `${siteOrigin(request)}/api/auth/callback`,
    scope: "openid email profile",
    state,
    code_challenge: pkceChallenge(verifier),
    code_challenge_method: "S256",
  }).toString();

  const res = NextResponse.redirect(authorize);
  res.cookies.set(COOKIE.pending, encodePendingLogin({ state, verifier, returnTo }), {
    httpOnly: true,
    secure: cookieSecure(),
    // Cognito からのトップレベル GET での戻りには Lax でも付く
    sameSite: "lax",
    path: PENDING_COOKIE_PATH,
    maxAge: 10 * 60,
  });
  return res;
}
