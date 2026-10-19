import { createHash, randomBytes } from "node:crypto";

// Cognito Hosted UI との Authorization Code + PKCE フローの部品。
// next/* に依存しない純粋な関数だけをここに置く(テストしやすくするため)。

export interface AuthConfig {
  userPoolId: string;
  clientId: string;
  /** Hosted UI のベース URL(https://<prefix>.auth.<region>.amazoncognito.com) */
  domain: string;
}

/**
 * 環境変数はリクエストのたびに読む。CDK はビルド時にも同じ名前の変数を渡すが、
 * そのときは未解決のトークン文字列("${Token[...]}")なので、モジュールの読み込み時に
 * 読んで固定してはいけない。未設定(ローカルで Cognito を繋いでいない等)なら null。
 */
export function getAuthConfig(env: Record<string, string | undefined> = process.env): AuthConfig | null {
  const userPoolId = env.COGNITO_USER_POOL_ID;
  const clientId = env.COGNITO_CLIENT_ID;
  const domain = env.COGNITO_DOMAIN;
  if (!userPoolId || !clientId || !domain) return null;
  return { userPoolId, clientId, domain: domain.replace(/\/+$/, "") };
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/** ログイン後の戻り先。オープンリダイレクトにならないよう、同じサイト内のパスだけ許す */
export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}

/** ログイン開始時に httpOnly クッキーへ入れておき、コールバックで照合する値 */
export interface PendingLogin {
  state: string;
  verifier: string;
  returnTo: string;
}

export function encodePendingLogin(pending: PendingLogin): string {
  return Buffer.from(JSON.stringify(pending)).toString("base64url");
}

export function decodePendingLogin(value: string | undefined): PendingLogin | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<PendingLogin>;
    if (typeof parsed.state !== "string" || typeof parsed.verifier !== "string") return null;
    return { state: parsed.state, verifier: parsed.verifier, returnTo: safeReturnTo(parsed.returnTo) };
  } catch {
    return null;
  }
}

export interface TokenResponse {
  id_token: string;
  access_token: string;
  /** authorization_code のときだけ返る。refresh_token グラントでは返らない */
  refresh_token?: string;
  expires_in: number;
}

export class TokenEndpointError extends Error {
  constructor(readonly status: number) {
    super(`Cognito token endpoint returned ${status}`);
  }
}

/** /oauth2/token を叩く(公開クライアントなのでシークレットは無し) */
export async function requestTokens(cfg: AuthConfig, params: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${cfg.domain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: cfg.clientId, ...params }),
    cache: "no-store",
  });
  if (!res.ok) throw new TokenEndpointError(res.status);
  return (await res.json()) as TokenResponse;
}

/** ログアウト時にリフレッシュトークンを失効させる(失敗しても致命的ではない) */
export async function revokeRefreshToken(cfg: AuthConfig, token: string): Promise<void> {
  await fetch(`${cfg.domain}/oauth2/revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: cfg.clientId, token }),
    cache: "no-store",
  });
}
