"use client";

import { useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@frost-ui/react/atoms/button";
import { Slider } from "@frost-ui/react/atoms/slider";
import { ShaderCodeEditor } from "@/components/ShaderCodeEditor";
import { ShaderEditorPreview } from "@/components/ShaderEditorPreview";
import { commit, createHistory, redo, undo } from "@/lib/editHistory";
import { useI18n } from "@/lib/i18n/client";
import { encodeSource } from "@/lib/stageUrl";

// 学習(/learn)の「書き換えられるコードとプレビュー」。/edit と同じエディタとプレビュー(ShaderCodeEditor・
// ShaderEditorPreview)を小さくまとめたもの。
// - 入力が 400ms 止まったらコンパイルし直し、履歴にも 1 段として記録する(/edit と同じ区切り)
// - 1 回のレッスンに 10 個ほど並ぶので、プレビューは画面の近くにあるときだけ WebGL を作る
//   (ブラウザが同時に持てる WebGL の数には上限がある。離れたら捨てる)
// - 「/edit で開く」は、コードを URL の # 以降に入れて新しいタブで開く(/edit がそれを読む)

const COMPILE_DELAY_MS = 400;

export type PlaygroundState = ReturnType<typeof usePlaygroundCode>;

export function usePlaygroundCode(initial: string) {
  const [code, setCode] = useState(initial);
  const [compiled, setCompiled] = useState(initial);
  const [history, setHistory] = useState(() => createHistory(initial));
  const [resetToken, setResetToken] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCompiled(code);
      setHistory((h) => commit(h, code));
    }, COMPILE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [code]);

  // 入力が止まる前(まだ記録していない分)があれば、それも 1 段として扱う
  const canUndo = history.past.length > 0 || code !== history.present;
  const canRedo = history.future.length > 0 && code === history.present;

  function move(next: typeof history) {
    setHistory(next);
    setCode(next.present);
    setCompiled(next.present);
  }

  return {
    code,
    compiled,
    resetToken,
    setCode,
    canUndo,
    canRedo,
    undo: () => {
      if (canUndo) move(undo(commit(history, code)));
    },
    redo: () => {
      if (canRedo) move(redo(history));
    },
    /** コードを丸ごと差し替える(最初に戻す・見本を入れる)。元に戻す で戻れる */
    replace: (source: string) => {
      setHistory((h) => commit(commit(h, code), source));
      setCode(source);
      setCompiled(source);
      setResetToken((n) => n + 1);
    },
  };
}

const noop = () => {};

/** 画面の近くにあるときだけ描くプレビュー(4:3) */
export function LazyShaderPreview({
  source,
  resetToken = 0,
  attention = 0,
}: {
  source: string;
  resetToken?: number;
  attention?: number;
}) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver((entries) => setNear(entries.some((entry) => entry.isIntersecting)), {
      rootMargin: "300px 0px",
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-950">
      {near ? (
        <ShaderEditorPreview source={source} playing attention={attention} resetToken={resetToken} onStats={noop} />
      ) : (
        <div className="absolute inset-0 grid place-items-center font-mono text-[11px] tracking-wide text-neutral-500">
          {t.learn.playground.offscreen}
        </div>
      )}
    </div>
  );
}

/** コードを入れた /edit の URL。コードが変わるたびに作り直す(圧縮は非同期なので、押す前に用意しておく) */
function useEditorHref(source: string): string {
  const [href, setHref] = useState("/edit");
  useEffect(() => {
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

export function PlaygroundFrame({
  state,
  original,
  attentionSlider,
}: {
  state: PlaygroundState;
  /** 「最初に戻す」で戻すコード */
  original: string;
  attentionSlider: boolean;
}) {
  const { t } = useI18n();
  const [attention, setAttention] = useState(0);
  const editorHref = useEditorHref(state.compiled);

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-base">
      <div className="grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div
          aria-label={t.learn.playground.code}
          role="group"
          className="order-2 flex max-h-[32rem] min-h-32 flex-col border-t border-border-subtle bg-bg-raised md:order-1 md:border-r md:border-t-0"
        >
          <ShaderCodeEditor value={state.code} onChange={state.setCode} onUndo={state.undo} onRedo={state.redo} />
        </div>
        <div className="order-1 flex flex-col md:order-2">
          <LazyShaderPreview source={state.compiled} resetToken={state.resetToken} attention={attention} />
          {attentionSlider && (
            <div className="flex items-center gap-sp-sm border-t border-border-subtle px-4 py-3">
              <span className="font-mono text-xs text-text-secondary">{t.learn.playground.attention}</span>
              <Slider
                value={attention}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(value) => setAttention(Array.isArray(value) ? (value[0] ?? 0) : value)}
                aria-label={t.learn.playground.attention}
                className="flex-1"
              />
              <span className="w-10 text-right font-mono text-xs text-text-muted">{attention.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1 border-t border-border-subtle px-2 py-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => state.replace(original)}
          disabled={state.code === original}
          title={t.learn.playground.resetHint}
        >
          {t.learn.playground.reset}
        </Button>
        <Button variant="ghost" size="sm" onClick={state.undo} disabled={!state.canUndo} title={t.edit.undoHint}>
          {t.edit.undo}
        </Button>
        <Button variant="ghost" size="sm" onClick={state.redo} disabled={!state.canRedo} title={t.edit.redoHint}>
          {t.edit.redo}
        </Button>
        <div className="flex-1" />
        <a
          href={editorHref}
          target="_blank"
          rel="noopener"
          title={t.learn.playground.openInEditorHint}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {t.learn.playground.openInEditor} ↗
        </a>
      </div>
    </div>
  );
}

export function LessonPlayground({ source, attentionSlider }: { source: string; attentionSlider: boolean }) {
  const state = usePlaygroundCode(source);
  return <PlaygroundFrame state={state} original={source} attentionSlider={attentionSlider} />;
}
