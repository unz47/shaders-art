"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { StageView } from "@/components/StageView";
import { useI18n } from "@/lib/i18n/client";
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
  const { t } = useI18n();

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
  if (hash !== null && !token) message = t.stage.nothingToShow;
  else if (current && current.source === null) message = t.stage.brokenUrl;

  return <StageView source={current?.source ?? null} message={message} creditHref="/" />;
}
