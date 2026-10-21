"use client";

import Link from "next/link";
import { Badge } from "@frost-ui/react/atoms/badge";
import { FavoriteButton, FavoriteCount } from "@/components/FavoriteButton";
import { ShaderThumbnail } from "@/components/ShaderThumbnail";
import { formatRelativeTime } from "@/lib/relativeTime";
import { useNow } from "@/lib/useNow";
import type { WorkSummary } from "@/lib/works";

// 仕様: Figma「Home 一覧の見せ方」案 A+B ① の New と、「すべて見る」(/works)のカード。
// 枠は付けず、サムネ 16:10 + 2 行(タイトル…bytes / 作者 · いつ…収蔵番号)。
//   info="time"       2 行目は「作者 · 12 分前」。収蔵済みならサムネに Collected の印
//   info="collection" 2 行目は「作者 · 年」と、右に収蔵番号(収蔵した順に並べるとき)
// 非公開の作品は「自分の作品」(/me)にだけ並ぶので、そこで見分けられるよう印を付ける
// お気に入りの ♡ はサムネの右上に重ねる。リンクの中にボタンを入れられないので、リンクと並べて置く
export function WorkCard({ work, info = "time" }: { work: WorkSummary; info?: "time" | "collection" }) {
  const now = useNow();
  const year = work.createdAt.slice(0, 4);
  const when = info === "collection" || now === null ? year : formatRelativeTime(work.createdAt, now);

  return (
    <div className="group relative">
      <Link href={`/s/${work.slug}/`} className="flex flex-col gap-2.5">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[10px]">
          <ShaderThumbnail source={work.source} thumbnail={work.thumbnail} alt={work.title} />
          {info === "time" && work.collected && (
            <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-bg-surface/90 px-2 py-0.5 font-mono text-[11px] text-text-primary">
              Collected
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-sp-sm">
            <h2 className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary transition-colors group-hover:text-accent-default">
              {work.title}
            </h2>
            {work.visibility === "private" && <Badge>非公開</Badge>}
            <span className="font-mono text-xs text-text-muted">{work.bytes} B</span>
          </div>
          <div className="flex items-baseline gap-sp-sm text-xs">
            <span className="min-w-0 flex-1 truncate text-text-secondary">
              {work.author} · {when}
            </span>
            {info === "collection" && work.collectionNo !== undefined ? (
              <span className="font-mono text-text-muted">No.{String(work.collectionNo).padStart(3, "0")}</span>
            ) : (
              <FavoriteCount work={work} className="text-text-muted" />
            )}
          </div>
        </div>
      </Link>
      <FavoriteButton work={work} variant="overlay" />
    </div>
  );
}
