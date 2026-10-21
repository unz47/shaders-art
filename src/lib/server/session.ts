import { CognitoJwtVerifier } from "aws-jwt-verify";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { type AuthConfig, getAuthConfig, requestTokens, TokenEndpointError, type TokenResponse } from "./oauth";

// セッション = Cognito の ID トークン(httpOnly クッキー)。期限が切れていたら
// リフレッシュトークンで取り直す。cookies() に書き込むので、Route Handler からだけ呼ぶこと。

export const COOKIE = {
  /** ID トークン。将来 Server Component からも読めるよう path は / */
  id: "sa_id",
  /** リフレッシュトークン。使うのは API だけなので /api に絞る */
  refresh: "sa_refresh",
  /** ログイン途中の state と PKCE の verifier。コールバックでだけ使う */
  pending: "sa_oauth",
} as const;

export const REFRESH_COOKIE_PATH = "/api";
export const PENDING_COOKIE_PATH = "/api/auth";
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60; // Cognito 側のリフレッシュトークン有効期限と揃える

export interface Session {
  /** Cognito のユーザー ID。投稿の持ち主として保存する */
  sub: string;
  email: string | null;
}

type CookieJar = Awaited<ReturnType<typeof cookies>>;

export function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production";
}

function createVerifier(cfg: AuthConfig) {
  return CognitoJwtVerifier.create({ userPoolId: cfg.userPoolId, tokenUse: "id", clientId: cfg.clientId });
}
// 公開鍵(JWKS)をキャッシュしたいので Lambda のインスタンス内で使い回す
let cachedVerifier: ReturnType<typeof createVerifier> | undefined;

export async function verifyIdToken(cfg: AuthConfig, token: string): Promise<Session> {
  cachedVerifier ??= createVerifier(cfg);
  const payload = await cachedVerifier.verify(token);
  return { sub: payload.sub, email: typeof payload.email === "string" ? payload.email : null };
}

export function setSessionCookies(jar: Pick<CookieJar, "set">, tokens: TokenResponse): void {
  const secure = cookieSecure();
  jar.set(COOKIE.id, tokens.id_token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: tokens.expires_in });
  if (tokens.refresh_token) {
    jar.set(COOKIE.refresh, tokens.refresh_token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: REFRESH_COOKIE_PATH,
      maxAge: REFRESH_MAX_AGE,
    });
  }
}

export function clearSessionCookies(jar: Pick<CookieJar, "delete">): void {
  jar.delete({ name: COOKIE.id, path: "/" });
  jar.delete({ name: COOKIE.refresh, path: REFRESH_COOKIE_PATH });
}

export async function getSession(): Promise<Session | null> {
  const cfg = getAuthConfig();
  if (!cfg) return null;
  const jar = await cookies();

  const idToken = jar.get(COOKIE.id)?.value;
  if (idToken) {
    try {
      return await verifyIdToken(cfg, idToken);
    } catch {
      // 期限切れなど。下でリフレッシュを試す
    }
  }

  const refreshToken = jar.get(COOKIE.refresh)?.value;
  if (!refreshToken) return null;
  try {
    const tokens = await requestTokens(cfg, { grant_type: "refresh_token", refresh_token: refreshToken });
    const session = await verifyIdToken(cfg, tokens.id_token);
    setSessionCookies(jar, tokens);
    return session;
  } catch (error) {
    // リフレッシュトークン自体が無効(失効・期限切れ)ならクッキーを消す。
    // 通信エラーなど一時的な失敗では消さない(次のリクエストでまた試せるように)
    if (error instanceof TokenEndpointError && error.status >= 400 && error.status < 500) {
      clearSessionCookies(jar);
    }
    return null;
  }
}

/**
 * このサイトの公開オリジン。OAuth の redirect_uri と、リダイレクト先の組み立てに使う。
 * 本番は CDK が SITE_URL を渡す。未設定なら CloudFront Function が付ける x-forwarded-host から作る。
 */
export function siteOrigin(request: NextRequest): string {
  const fromEnv = process.env.SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  const host = request.headers.get("x-forwarded-host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return request.nextUrl.origin;
}

/**
 * 状態を変える API の CSRF 対策。ブラウザは POST に Origin を付けるので、
 * 付いていてこのサイトと違えば拒否する(付いていない = ブラウザ以外からの呼び出しは通す)。
 * SameSite=Lax のクッキーと合わせて二重の防御。
 */
export function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return origin === null || origin === siteOrigin(request);
}
