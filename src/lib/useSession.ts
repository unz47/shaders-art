"use client";

import { useEffect, useState } from "react";

export interface SessionUser {
  email: string | null;
}

export type SessionState =
  | { status: "loading" }
  /** configured: false = サーバーに Cognito の設定が無い(ローカルで繋いでいない等)。Sign in を出さない */
  | { status: "ready"; configured: boolean; user: SessionUser | null };

type MeResponse = { configured: boolean; user: SessionUser | null };

// ヘッダーと /edit の両方で使うので、1 ページの読み込みにつき 1 回だけ問い合わせる。
// ログイン・ログアウトはどちらもページ遷移(リダイレクト)を伴うので、これで古くならない。
let pending: Promise<MeResponse> | null = null;

function fetchMe(): Promise<MeResponse> {
  pending ??= fetch("/api/auth/me", { cache: "no-store" })
    .then((res) => (res.ok ? (res.json() as Promise<MeResponse>) : { configured: false, user: null }))
    .catch(() => ({ configured: false, user: null }));
  return pending;
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    void fetchMe().then((me) => {
      if (!cancelled) setState({ status: "ready", ...me });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** ログイン画面へ。戻ってきたら今のページに戻す */
export function loginHref(returnTo: string): string {
  return `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
}
