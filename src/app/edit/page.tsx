"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@frost-ui/react/atoms/badge";
import { Button } from "@frost-ui/react/atoms/button";
import { Header } from "@/components/Header";
import { ShaderCodeEditor } from "@/components/ShaderCodeEditor";
import { ShaderEditorPreview, type ShaderEditorStats } from "@/components/ShaderEditorPreview";

// 仕様: Figma "Edit / Desktop 1440"(node 63:421、エラー状態は 65:429)
// WorkDetail(/s/[slug])と同じ「左にコード・右に描画」の構えだが、こちらは
// コードが編集可能で、Pre-publish checksを常時計算して表示する。
// 投稿・審査パイプライン自体はまだ無い(Notionのプロジェクトメモに未着手と
// 明記されてる)ので、ここのチェックはあくまで下書き段階の目安。

const STARTER_SOURCE = ["vec4 render(vec2 uv, vec2 p) {", "  return vec4(uv, 0.5, 1.0);", "}"].join("\n");

const SIZE_BUDGET_BYTES = 4096; // 4 KB
const FRAME_TIME_BUDGET_MS = 8;
const LOOP_ITERATION_BUDGET = 64;

// for(...; i < N; ...) のNが数値リテラルのループだけを検出する簡易チェック。
// 変数を上限に使うループや while は判定できないので、それらは一律「要確認」扱いにする。
// (投稿審査の閾値自体がNotion側でも「仮置き」とされているので、ここも厳密さより
// 目安であることを優先している)
function checkLoopsBounded(source: string): { ok: boolean | null; detail: string } {
  if (/\bwhile\s*\(/.test(source)) {
    return { ok: null, detail: "while ループは手動確認が必要" };
  }
  const bounds: number[] = [];
  const forLoopPattern = /for\s*\([^;]*;\s*\w+\s*<\s*(\d+)\s*;[^)]*\)/g;
  let match: RegExpExecArray | null;
  while ((match = forLoopPattern.exec(source))) {
    bounds.push(Number(match[1]));
  }
  if (bounds.length === 0) {
    return { ok: true, detail: "ループなし" };
  }
  const maxBound = Math.max(...bounds);
  if (maxBound > LOOP_ITERATION_BUDGET) {
    return { ok: false, detail: `max ${maxBound} > ${LOOP_ITERATION_BUDGET} iterations` };
  }
  return { ok: true, detail: `max ${maxBound} iterations` };
}

export default function EditPage() {
  const [code, setCode] = useState(STARTER_SOURCE);
  // GLSLの再コンパイルはキー入力のたびにやると重いので、入力が少し止まってから反映する
  const [compiledSource, setCompiledSource] = useState(STARTER_SOURCE);
  const [playing, setPlaying] = useState(true);
  const [resetToken, setResetToken] = useState(0);
  const [stats, setStats] = useState<ShaderEditorStats>({ fps: 0, elapsed: 0, frameTimeMs: 0, error: null });
  const [hasRendered, setHasRendered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCompiledSource(code), 400);
    return () => clearTimeout(timer);
  }, [code]);

  const handleStats = useCallback((next: ShaderEditorStats) => {
    setStats(next);
    setHasRendered(true);
  }, []);

  function handleReset() {
    setCode(STARTER_SOURCE);
    setCompiledSource(STARTER_SOURCE);
    setHasRendered(false);
    setResetToken((t) => t + 1);
  }

  const bytes = new TextEncoder().encode(code).length;
  const hasFragCoord = code.includes("gl_FragCoord");
  const loopCheck = checkLoopsBounded(code);

  const checks: { key: string; label: string; ok: boolean | null; detail: string }[] = [
    {
      key: "compiles",
      label: "Compiles",
      ok: hasRendered ? stats.error === null : null,
      detail: !hasRendered ? "確認中…" : (stats.error ?? "WebGL2 · GLSL ES 3.00"),
    },
    {
      key: "size",
      label: "Size",
      ok: bytes <= SIZE_BUDGET_BYTES,
      detail: `${bytes} B / ${SIZE_BUDGET_BYTES / 1024} KB`,
    },
    {
      key: "frame-time",
      label: "Frame time",
      ok: hasRendered ? stats.frameTimeMs <= FRAME_TIME_BUDGET_MS : null,
      detail: hasRendered ? `${stats.frameTimeMs.toFixed(1)} ms / ${FRAME_TIME_BUDGET_MS} ms budget` : "確認中…",
    },
    {
      key: "no-fragcoord",
      label: "No gl_FragCoord",
      ok: !hasFragCoord,
      detail: hasFragCoord ? "gl_FragCoord は使えません" : "render(uv, p) only",
    },
    {
      key: "loops",
      label: "Loops bounded",
      ok: loopCheck.ok,
      detail: loopCheck.detail,
    },
  ];
  const passedCount = checks.filter((c) => c.ok === true).length;
  const allPassed = passedCount === checks.length;

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* 左: コード(編集可能) */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border-subtle px-6 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">Untitled</p>
              <p className="text-xs tracking-wide text-text-secondary">下書き · 未保存</p>
            </div>
            {/* フォーマッタは未実装。将来ここにGLSL整形を入れる想定の置き場所 */}
            <Button variant="secondary" size="sm" disabled>
              フォーマット
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              リセット
            </Button>
          </div>
          <div className="flex items-center gap-3 border-b border-border-subtle px-6 py-2 font-mono text-[11px] text-text-muted">
            <span className="flex-1">main.glsl</span>
            <span>vec4 render(vec2 uv, vec2 p)</span>
          </div>
          <ShaderCodeEditor value={code} onChange={setCode} />
        </div>

        {/* 右: ステージ(ライブプレビュー + 審査チェック) */}
        <div className="flex w-full max-w-[45%] flex-col gap-4 overflow-auto border-l border-border-subtle p-4">
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-surface border border-border-subtle">
            <ShaderEditorPreview
              source={compiledSource}
              playing={playing}
              attention={0}
              resetToken={resetToken}
              onStats={handleStats}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPlaying((p) => !p)}>
              {playing ? "一時停止" : "再生"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setResetToken((t) => t + 1)}>
              先頭へ
            </Button>
            <div className="flex-1" />
            <Badge>{bytes} bytes</Badge>
            <Badge>{stats.fps} fps</Badge>
            <Badge>{stats.elapsed.toFixed(1)} s</Badge>
          </div>

          <div className="rounded-surface border border-border-subtle">
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
              <span className="text-sm font-medium text-text-primary">Pre-publish checks</span>
              <span className={`text-xs ${allPassed ? "text-text-muted" : "text-danger-solid"}`}>
                {passedCount} / {checks.length} passed
              </span>
            </div>
            <div className="flex flex-col">
              {checks.map((c) => (
                <div key={c.key} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span
                    className={`w-4 shrink-0 text-center ${
                      c.ok === null ? "text-text-muted" : c.ok ? "text-accent-default" : "text-danger-solid"
                    }`}
                  >
                    {c.ok === null ? "…" : c.ok ? "✓" : "✕"}
                  </span>
                  <span className={`flex-1 ${c.ok === false ? "text-danger-solid" : "text-text-primary"}`}>{c.label}</span>
                  <span className={`font-mono text-xs ${c.ok === false ? "text-danger-solid" : "text-text-muted"}`}>
                    {c.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* /submit はまだ無いので、いまは見た目だけ */}
      <div className="flex items-center justify-end border-t border-border-subtle bg-bg-base px-8 py-4">
        <Button variant="primary" size="md" disabled>
          Submitへ進む
        </Button>
      </div>
    </div>
  );
}
