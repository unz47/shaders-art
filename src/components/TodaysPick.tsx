"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ShaderEditorPreview } from "@/components/ShaderEditorPreview";
import type { WorkSummary } from "@/lib/works";

// 仕様: Figma「Home 一覧の見せ方」案 A+B ① の「今日の 1 点」。
// Home でいちばん大きく、常に再生する(ほかのタイルは静止画 + ホバー再生)。
// 端末で「視差効果を減らす」が設定されていたら止めておく。全体が作品ページへのリンク。

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function noop() {}

export function TodaysPick({ work, className = "" }: { work: WorkSummary; className?: string }) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
  const label =
    work.collectionNo !== undefined ? `TODAY'S PICK  ·  収蔵 No.${String(work.collectionNo).padStart(3, "0")}` : "TODAY'S PICK";

  return (
    <Link href={`/s/${work.slug}/`} className={`group relative block overflow-hidden rounded-2xl bg-black ${className}`}>
      <div className="absolute inset-0">
        <ShaderEditorPreview source={work.source} playing={!reducedMotion} attention={0} resetToken={0} onStats={noop} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[300px] max-h-full bg-linear-to-b from-transparent via-black/40 to-black/80" />
      {!reducedMotion && (
        <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-black/45 px-2.5 py-1 font-mono text-[11px] text-white/90 sm:right-6 sm:top-6">
          ● live
        </span>
      )}
      <div className="pointer-events-none absolute inset-x-6 bottom-6 flex flex-wrap items-end gap-4 sm:inset-x-10 sm:bottom-10">
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <span className="whitespace-pre font-mono text-[11px] tracking-[0.08em] text-white/75">{label}</span>
          <span className="truncate text-3xl font-medium tracking-tight text-white sm:text-[44px] sm:leading-tight">
            {work.title}
          </span>
          <span className="flex flex-wrap gap-x-4 font-mono text-[13px] text-white/80">
            <span>
              {work.author} · {work.createdAt.slice(0, 4)}
            </span>
            <span>{work.bytes} B</span>
            <span>{work.license.replace(/-\d.*$/, "")}</span>
          </span>
        </div>
        {/* 狭い画面では作品名を優先する(タイル全体がリンクなので、ボタンが無くても押せる) */}
        <span className="hidden rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-transform group-hover:-translate-y-0.5 sm:inline-block">
          作品を見る →
        </span>
      </div>
    </Link>
  );
}
