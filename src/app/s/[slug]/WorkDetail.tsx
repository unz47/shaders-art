"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@frost-ui/react/atoms/badge";
import { Button } from "@frost-ui/react/atoms/button";
import { useToast } from "@frost-ui/react/organisms/toast";
import { CodeBlock } from "@/components/CodeBlock";
import { Header } from "@/components/Header";
import { getWork, type Work } from "@/lib/works";

// 仕様: Figma "Shader / Desktop 1440"(node 41:513)。/edit と同じ「左にコード・
// 右に描画」の構え。ただし本物のレンダラはまだ無いので、右側は Home と同じ
// 静止サムネイルを表示するだけ(一時停止・先頭へは見た目だけの飾り)。
// attention(ホバーで演出が変わる仕組み)は Home のカード側の仕様なので、
// このページでは扱わない。

type State = { status: "loading" } | { status: "missing" } | { status: "found"; work: Work };

export function WorkDetail({ slug }: { slug: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    void getWork(slug).then((work) => {
      if (!cancelled) setState(work ? { status: "found", work } : { status: "missing" });
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const copySource = useCallback(
    (source: string) => {
      void navigator.clipboard
        .writeText(source)
        .then(() => toast.add({ title: "コピーしました", description: "main.glsl の内容をクリップボードに入れました。" }))
        .catch(() => toast.add({ title: "コピーできませんでした", priority: "high" }));
    },
    [toast],
  );

  if (state.status === "loading") {
    return (
      <div className="flex min-h-dvh flex-col">
        <Header />
        <div className="grid flex-1 place-items-center text-sm text-text-muted">読み込み中…</div>
      </div>
    );
  }

  if (state.status === "missing") {
    return (
      <div className="flex min-h-dvh flex-col">
        <Header />
        <div className="grid flex-1 place-items-center text-sm text-text-muted">この作品は見つかりませんでした。</div>
      </div>
    );
  }

  const { work } = state;

  const spec: [string, string][] = [
    ["Size", `${work.bytes} B`],
    ["License", work.license],
    ["Published", work.createdAt],
  ];
  if (work.collected) spec.push(["Collected", work.createdAt]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* 左: コード */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border-subtle px-6 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">{work.title}</p>
              <p className="text-xs tracking-wide text-text-secondary">
                {work.author} · {work.createdAt}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => copySource(work.source)}>
              コードをコピー
            </Button>
            {/* /edit はまだ無いので、いまは見た目だけ */}
            <Button variant="primary" size="sm" disabled>
              エディタで開く
            </Button>
          </div>
          <div className="flex items-center gap-3 border-b border-border-subtle px-6 py-2 font-mono text-[11px] text-text-muted">
            <span className="flex-1">main.glsl</span>
            <span>vec4 render(vec2 uv, vec2 p)</span>
          </div>
          <CodeBlock source={work.source} />
        </div>

        {/* 右: ステージ(いまは静止画) */}
        <div className="flex w-full max-w-[45%] flex-col gap-4 overflow-auto border-l border-border-subtle p-4">
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-surface border border-border-subtle">
            <Image src={work.thumbnail} alt={work.title} fill className="object-cover" />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled>
              一時停止
            </Button>
            <Button variant="ghost" size="sm" disabled>
              先頭へ
            </Button>
            <div className="flex-1" />
            <Badge>{work.bytes} bytes</Badge>
            <Badge>60 fps</Badge>
            <Badge>0.0 s</Badge>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-text-secondary">{work.description}</p>
            <dl className="flex flex-col text-xs">
              {spec.map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-3 border-t border-border-subtle py-2">
                  <dt className="flex-1 tracking-wide text-text-muted">{k}</dt>
                  <dd className="font-mono text-text-primary">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-2">
              {work.tags.map((t) => (
                <Badge key={t}>#{t}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
