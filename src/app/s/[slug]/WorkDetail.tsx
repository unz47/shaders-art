"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@frost-ui/react/atoms/badge";
import { Button } from "@frost-ui/react/atoms/button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@frost-ui/react/organisms/menu";
import { useToast } from "@frost-ui/react/organisms/toast";
import { CodeBlock } from "@/components/CodeBlock";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Header } from "@/components/Header";
import { ShaderStage } from "@/components/ShaderStage";
import { embedSnippet, stageUrlForSource, stageUrlForWork } from "@/lib/stageUrl";
import { getWork, type Work } from "@/lib/works";

// 仕様: Figma "Shader / Desktop 1440"(node 41:513)。/edit と同じ「左にコード・
// 右に描画」の構え。右側は ShaderStage(Three.js)で実際に GLSL を動かす。
// attention(ホバーで演出が変わる仕組み)は Home のカード側の仕様なので、
// このページでは扱わない(0 固定)。

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

  // 配信背景・埋め込み用の URL。公開作品は slug の URL、非公開作品はほかの人が開けないので
  // コードを URL に入れる(圧縮が非同期なので、コピーのクリックより前に作っておく)
  const [stageUrl, setStageUrl] = useState<string | null>(null);
  useEffect(() => {
    if (state.status !== "found") return;
    const { work } = state;
    const origin = window.location.origin;
    let cancelled = false;
    const url =
      work.visibility === "private"
        ? stageUrlForSource(origin, work.source)
        : Promise.resolve(stageUrlForWork(origin, work.slug));
    void url.then((value) => {
      if (!cancelled) setStageUrl(value);
    });
    return () => {
      cancelled = true;
    };
  }, [state]);

  const copyText = useCallback(
    (text: string, title: string, description: string) => {
      void navigator.clipboard
        .writeText(text)
        .then(() => toast.add({ title, description }))
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

  // 投稿 API は ISO の日時、初期データは日付だけで入っているので、日付部分だけ見せる
  const published = work.createdAt.slice(0, 10);
  const spec: [string, string][] = [
    ["公開設定", work.visibility === "private" ? "非公開" : "公開"],
    ["Size", `${work.bytes} B`],
    ["License", work.license],
    ["Published", published],
  ];
  if (work.collected) spec.push(["Collected", published]);

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
                {work.author} · {published}
              </p>
            </div>
            <FavoriteButton work={work} variant="inline" />
            <Menu>
              <MenuTrigger render={<Button variant="ghost" size="sm" disabled={!stageUrl} />}>配信・埋め込み</MenuTrigger>
              <MenuContent align="end">
                <MenuItem
                  onClick={() =>
                    stageUrl &&
                    copyText(
                      stageUrl,
                      "配信背景用の URL をコピーしました",
                      "OBS の「ソース」→「ブラウザ」の URL に貼り付け、幅 1920・高さ 1080 にしてください。壁紙アプリにも使えます。",
                    )
                  }
                >
                  配信背景用の URL をコピー
                </MenuItem>
                <MenuItem
                  onClick={() =>
                    stageUrl &&
                    copyText(
                      embedSnippet(stageUrl, work.title),
                      "埋め込みコードをコピーしました",
                      "ブログやサイトの HTML に貼り付けてください。",
                    )
                  }
                >
                  埋め込みコードをコピー
                </MenuItem>
              </MenuContent>
            </Menu>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyText(work.source, "コピーしました", "作品のコードをクリップボードに入れました。")}
            >
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

        {/* 右: ステージ(実際に GLSL を描画) */}
        <div className="flex w-full max-w-[45%] flex-col gap-4 overflow-auto border-l border-border-subtle p-4">
          <ShaderStage source={work.source} bytes={work.bytes} />

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
