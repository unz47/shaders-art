"use client";

import { useMemo, useSyncExternalStore } from "react";
import { ShaderEditorPreview } from "@/components/ShaderEditorPreview";
import { parseStageOptions } from "@/lib/stageUrl";

// /stage の中身。作品をウィンドウいっぱいに描くだけで、操作のための UI は出さない
// (OBS のブラウザソースや壁紙アプリにそのまま使えるように)。
// 他のサイトに iframe で埋め込まれたときだけ、右下に作者表記(shaders.art へのリンク)を出す。

function subscribeNothing() {
  return () => {};
}

function noop() {}

export function StageView({
  source,
  message,
  creditHref,
}: {
  /** 描く作品のコード。読み込み中や見つからないときは null */
  source: string | null;
  /** source が null のときに出す文(読み込み中は空) */
  message: string;
  /** 作者表記のリンク先 */
  creditHref: string;
}) {
  const search = useSyncExternalStore(subscribeNothing, () => window.location.search, () => "");
  const options = useMemo(() => parseStageOptions(search), [search]);
  const embedded = useSyncExternalStore(subscribeNothing, () => window.self !== window.top, () => false);

  return (
    <div className="fixed inset-0 bg-black">
      {source !== null ? (
        <ShaderEditorPreview
          source={source}
          playing
          attention={options.attention}
          speed={options.speed}
          resetToken={0}
          onStats={noop}
        />
      ) : (
        <p className="grid h-full place-items-center text-sm text-white/60">{message}</p>
      )}
      {embedded && (
        <a
          href={creditHref}
          target="_blank"
          rel="noopener"
          className="absolute bottom-2 right-2 rounded-control bg-black/50 px-2 py-1 font-serif text-xs italic text-white/80 hover:text-white"
        >
          shaders.art
        </a>
      )}
    </div>
  );
}
