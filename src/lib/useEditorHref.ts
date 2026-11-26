"use client";

import { useEffect, useState } from "react";
import { encodeSource } from "@/lib/stageUrl";

/**
 * コードを入れた /edit の URL(/edit#src=…)。/edit は開いたときに # 以降を読む。
 * 圧縮が非同期なので、押す前に用意しておき、コードが変わるたびに作り直す。
 * コードがまだ無い(null)ときや作れなかったときは、何も入っていない /edit を返す。
 * 学習の「/edit で開く」と、作品ページの「エディタで開く」で使う
 */
export function useEditorHref(source: string | null): string {
  const [href, setHref] = useState("/edit");
  useEffect(() => {
    if (source === null) return;
    let cancelled = false;
    encodeSource(source).then(
      (token) => {
        if (!cancelled) setHref(`/edit#src=${token}`);
      },
      () => {
        if (!cancelled) setHref("/edit");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [source]);
  return href;
}
