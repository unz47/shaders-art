"use client";

import Link from "@/components/Link";
import { Badge } from "@frost-ui/react/atoms/badge";
import { FavoriteButton, FavoriteCount } from "@/components/FavoriteButton";
import { ShaderThumbnail } from "@/components/ShaderThumbnail";
import { useI18n } from "@/lib/i18n/client";
import { formatRelativeTime } from "@/lib/relativeTime";
import { useNow } from "@/lib/useNow";
import type { WorkSummary } from "@/lib/works";

// 仕様: Figma「Home 一覧の見せ方」案 A+B ① の New と、「すべて見る」(/works)のカード。
// 枠は付けず、サムネ 16:10 + 2 行(タイトル…bytes / 作者 · 12 分前…お気に入りの数)。
// 非公開の作品は「自分の作品」(/me)にだけ並ぶので、そこで見分けられるよう印を付ける
// お気に入りの ♡ はサムネの右上に重ねる。リンクの中にボタンを入れられないので、リンクと並べて置く

/**
 * カードを並べる格子。スマホ幅でも 2 列にして、1 画面に 4〜6 作品見えるようにする(1 列だと 1 作品で画面の半分を使う)。
 * 広い画面での列の数は、使う側で lg:grid-cols-… を足す
 */
export const WORK_GRID = "grid grid-cols-2 content-start gap-x-3 gap-y-6 sm:gap-x-sp-lg sm:gap-y-8";

export function WorkCard({ work }: { work: WorkSummary }) {
  const now = useNow();
  const { t } = useI18n();
  const when = now === null ? work.createdAt.slice(0, 4) : formatRelativeTime(work.createdAt, now, t.time);

  return (
    <div className="group relative">
      <Link href={`/s/${work.slug}/`} className="flex flex-col gap-2.5">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[10px]">
          <ShaderThumbnail source={work.source} thumbnail={work.thumbnail} alt={work.title} />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-sp-sm">
            <h2 className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary transition-colors group-hover:text-accent-default">
              {work.title}
            </h2>
            {work.visibility === "private" && <Badge>{t.common.private}</Badge>}
            <span className="font-mono text-xs text-text-muted">{work.bytes} B</span>
          </div>
          <div className="flex items-baseline gap-sp-sm text-xs">
            <span className="min-w-0 flex-1 truncate text-text-secondary">
              {work.author} · {when}
            </span>
            <FavoriteCount work={work} className="text-text-muted" />
          </div>
        </div>
      </Link>
      <FavoriteButton work={work} variant="overlay" />
    </div>
  );
}
