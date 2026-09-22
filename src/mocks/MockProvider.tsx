"use client";

import { useEffect, useState } from "react";

// モック API を起動してから中身を描く。起動前に fetch が飛ぶと素通りしてしまうため。
// 開発モードでは effect が 2 回走るので、起動は 1 回だけにする。
let starting: Promise<void> | null = null;

function startMocks(): Promise<void> {
  starting ??= import("./browser").then(({ worker }) =>
    worker.start({ onUnhandledRequest: "bypass", quiet: true }).then(() => undefined),
  );
  return starting;
}

export function MockProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(process.env.NODE_ENV !== "development");

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
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
