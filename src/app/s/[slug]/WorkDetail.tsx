"use client";

import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Badge } from "@frost-ui/react/atoms/badge";
import { Button } from "@frost-ui/react/atoms/button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@frost-ui/react/organisms/menu";
import { useToast } from "@frost-ui/react/organisms/toast";
import { CodeBlock } from "@/components/CodeBlock";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Header } from "@/components/Header";
import { ShaderStage } from "@/components/ShaderStage";
import { embedSnippet, stageUrlForSource, stageUrlForWork } from "@/lib/stageUrl";
import { useI18n } from "@/lib/i18n/client";
import { findLicense, licenseUrl } from "@/lib/submission";
import { getWork, type Work } from "@/lib/works";

// 仕様: Figma "Shader / Desktop 1440"(node 41:513)。/edit と同じ「左にコード・
// 右に描画」の構え。右側は ShaderStage(Three.js)で実際に GLSL を動かす。
// attention(ホバーで演出が変わる仕組み)は Home のカード側の仕様なので、
// このページでは扱わない(0 固定)。

type State = { status: "loading" } | { status: "missing" } | { status: "found"; work: Work };

export function WorkDetail({ slug }: { slug: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const toast = useToast();
  const { locale, t } = useI18n();

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
        .catch(() => toast.add({ title: t.work.copyFailed, priority: "high" }));
    },
    [toast, t],
  );

  if (state.status === "loading") {
    return (
      <div className="flex min-h-dvh flex-col">
        <Header />
        <div className="grid flex-1 place-items-center text-sm text-text-muted">{t.work.loading}</div>
      </div>
    );
  }

  if (state.status === "missing") {
    return (
      <div className="flex min-h-dvh flex-col">
        <Header />
        <div className="grid flex-1 place-items-center text-sm text-text-muted">{t.work.notFound}</div>
      </div>
    );
  }

  const { work } = state;

  // 投稿 API は ISO の日時、初期データは日付だけで入っているので、日付部分だけ見せる
  const published = work.createdAt.slice(0, 10);
  const license = findLicense(work.license);
  const licenseLabel = license ? t.license[license.id].label : work.license;
  const spec: [string, ReactNode][] = [
    [t.work.visibility, work.visibility === "private" ? t.common.private : t.work.public],
    ["Size", `${work.bytes} B`],
    [
      "License",
      // 標準は利用規約の該当箇所へ、CC はクリエイティブ・コモンズの説明ページへ
      license ? (
        license.url.startsWith("/") ? (
          <Link href={license.url} className="underline underline-offset-2 hover:text-text-secondary">
            {licenseLabel}
          </Link>
        ) : (
          <a
            href={licenseUrl(license, locale)}
            target="_blank"
            rel="noopener"
            className="underline underline-offset-2 hover:text-text-secondary"
          >
            {licenseLabel}
          </a>
        )
      ) : (
        work.license
      ),
    ],
    ["Published", published],
  ];

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
              <MenuTrigger render={<Button variant="ghost" size="sm" disabled={!stageUrl} />}>{t.work.streamEmbed}</MenuTrigger>
              <MenuContent align="end">
                <MenuItem
                  onClick={() =>
                    stageUrl &&
                    copyText(
                      stageUrl,
                      t.work.stageUrlCopied,
                      t.work.stageUrlHint,
                    )
                  }
                >
                  {t.work.copyStageUrl}
                </MenuItem>
                <MenuItem
                  onClick={() =>
                    stageUrl &&
                    copyText(
                      embedSnippet(stageUrl, work.title),
                      t.work.embedCopied,
                      t.work.embedHint,
                    )
                  }
                >
                  {t.work.copyEmbed}
                </MenuItem>
              </MenuContent>
            </Menu>
            <Button
              variant="ghost"
              size="sm"
              // コードはそのまま読めるのでコピーも止めないが、サイトの外での使い方はライセンスに従ってもらう
              onClick={() =>
                copyText(
                  work.source,
                  t.work.copied,
                  license ? t.work.copiedUnder(licenseLabel, t.license[license.id].reuse) : t.work.codeCopied,
                )
              }
            >
              {t.work.copyCode}
            </Button>
            {/* /edit はまだ無いので、いまは見た目だけ */}
            <Button variant="primary" size="sm" disabled>
              {t.work.openInEditor}
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
