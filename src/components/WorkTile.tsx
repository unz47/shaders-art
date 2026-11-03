import Link from "next/link";
import { FavoriteCount } from "@/components/FavoriteButton";
import { ShaderThumbnail } from "@/components/ShaderThumbnail";
import type { WorkSummary } from "@/lib/works";

// 仕様: Figma「Home 一覧の見せ方」案 A+B ① のモザイクのタイル。
// 枠は付けず、作品名と「作者 · バイト数」を絵の下側に重ねる(明るい作品でも読めるよう下に影を敷く)。
// 大きさは並べる側(grid の span)で決める。ホバーで再生し、縁にアクセント色の線を出す。
export function WorkTile({ work, className = "" }: { work: WorkSummary; className?: string }) {
  return (
    <Link href={`/s/${work.slug}/`} className={`group relative block overflow-hidden rounded-[14px] ${className}`}>
      <ShaderThumbnail source={work.source} thumbnail={work.thumbnail} alt={work.title} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[150px] max-h-full bg-linear-to-b from-transparent via-black/40 to-black/80" />
      <div className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-col gap-1">
        <span className="truncate text-[15px] font-medium text-white">{work.title}</span>
        <span className="flex items-center gap-2 truncate font-mono text-[11px] text-white/80">
          <span className="truncate">
            {work.author} · {work.bytes} B
          </span>
          <FavoriteCount work={work} />
        </span>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-[14px] opacity-0 ring-2 ring-accent-default ring-inset transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
