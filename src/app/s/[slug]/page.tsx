import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { isPublicWork } from "@/lib/moderation";
import { getWorkRow } from "@/lib/server/moderation";
import { pageMetadata } from "@/lib/site";
import { WorkDetail } from "./WorkDetail";

// SSR なので slug は全部リクエスト時に解決する(投稿された作品もそのまま開ける)。
// 中身の取得は WorkDetail が実行時に /api/works/:slug から行う。

interface Params {
  params: Promise<{ slug: string }>;
}

// 検索結果と、X や Discord にリンクを貼ったときのカードに、作品名と作者を出す。
// 公開していない作品(作者の非公開・通報や運営による非公開)は名前を出さず、検索にも載せない
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  try {
    const row = await getWorkRow(slug, { consistent: false });
    if (!row || !isPublicWork(row)) return { robots: { index: false } };
    const t = await getDictionary();
    const title = oneLine(row.title, 100) || "Untitled";
    const author = oneLine(row.author, 60) || "Anonymous";
    const bytes = typeof row.bytes === "number" ? row.bytes : 0;
    return {
      ...pageMetadata(`${title} by ${author}`, t.meta.work(author, bytes)),
      alternates: { canonical: `/s/${slug}` },
    };
  } catch (error) {
    // 表が読めなくても作品ページは出す(中身はブラウザが API から取る)
    console.error("work metadata", error);
    return {};
  }
}

function oneLine(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/[\r\n\u2028\u2029]+/g, " ").trim().slice(0, max) : "";
}

export default async function WorkPage({ params }: Params) {
  const { slug } = await params;
  return <WorkDetail slug={slug} />;
}
