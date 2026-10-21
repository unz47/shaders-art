"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { StageView } from "@/components/StageView";
import { decodeSource, sourceTokenFromHash } from "@/lib/stageUrl";

function subscribeHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

export function StageDraft() {
  // サーバーでは # が見えないので null(まだわからない)。何も出さずに待つ
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash, () => null);
  const token = hash === null ? null : sourceTokenFromHash(hash);
  const [decoded, setDecoded] = useState<{ token: string; source: string | null } | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    decodeSource(token).then(
      (source) => {
        if (!cancelled) setDecoded({ token, source });
      },
      () => {
        if (!cancelled) setDecoded({ token, source: null });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [token]);

  const current = decoded && decoded.token === token ? decoded : null;
  let message = "";
  if (hash !== null && !token) message = "表示する作品がありません";
  else if (current && current.source === null) message = "URL が壊れているため、作品を表示できません";

  return <StageView source={current?.source ?? null} message={message} creditHref="/" />;
}
