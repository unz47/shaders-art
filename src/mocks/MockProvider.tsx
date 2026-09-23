"use client";

import { useEffect, useState } from "react";

// モック API を起動してから中身を描く。起動前に fetch が飛ぶと素通りしてしまうため。
//   開発(pnpm dev) …… .env の NEXT_PUBLIC_API_MOCK=0 が既定(本物のバックエンドに繋ぐ)。
//                      NEXT_PUBLIC_API_MOCK=1 pnpm dev で上書きするとモックに戻せる。
//   本番ビルド ……… 既定で無効。NEXT_PUBLIC_API_MOCK=1 のときだけ有効
const FLAG = process.env.NEXT_PUBLIC_API_MOCK;
const ENABLED = FLAG === "1" || (process.env.NODE_ENV === "development" && FLAG !== "0");

// 開発モードでは effect が 2 回走るので、起動は 1 回だけにする。
let starting: Promise<void> | null = null;

function startMocks(): Promise<void> {
  starting ??= import("./browser").then(({ worker }) =>
    worker.start({ onUnhandledRequest: "bypass", quiet: true }).then(() => undefined),
  );
  return starting;
}

export function MockProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!ENABLED);

  useEffect(() => {
    if (!ENABLED) return;
    let cancelled = false;
    void startMocks().finally(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
