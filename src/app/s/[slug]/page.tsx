import type { Metadata } from "next";
import { cache } from "react";
import { JsonLd } from "@/components/JsonLd";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { isPublicWork } from "@/lib/moderation";
import { toPublicWork } from "@/lib/server/db";
import { getWorkRow } from "@/lib/server/moderation";
import { pageMetadata } from "@/lib/site";
import { workData } from "@/lib/structuredData";
import type { Work } from "@/lib/works";
import { WorkDetail } from "./WorkDetail";

// SSR なので slug は全部リクエスト時に解決する(投稿された作品もそのまま開ける)。
// 公開の作品は、サーバーで読んで作品名・作者・説明・コードを HTML に入れる(検索エンジンや AI が
// JavaScript を動かさずに読めるように)。見ている人との関係(作者か・通報したか)と、非公開の作品(作者と運営にだけ
// 見える)は、これまでどおり WorkDetail がブラウザから /api/works/:slug で取る。

interface Params {
  params: Promise<{ slug: string }>;
}

/** 公開の作品だけを返す。メタデータとページで 2 回読まないよう、1 回のリクエストの中では覚えておく */
const getPublicWork = cache(async (slug: string): Promise<Work | null> => {
  try {
    const row = await getWorkRow(slug, { consistent: false });
    return row && isPublicWork(row) ? (toPublicWork(row) as unknown as Work) : null;
  } catch (error) {
    // 表が読めなくても作品ページは出す(中身はブラウザが API から取る)
    console.error("work page", error);
    return null;
  }
});

// 検索結果と、X や Discord にリンクを貼ったときのカードに、作品名と作者を出す。
// 公開していない作品(作者の非公開・通報や運営による非公開)は名前を出さず、検索にも載せない
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const [work, locale, t] = await Promise.all([getPublicWork(slug), getLocale(), getDictionary()]);
  if (!work) return { robots: { index: false } };
  const title = oneLine(work.title, 100) || "Untitled";
  const author = oneLine(work.author, 60) || "Anonymous";
  const bytes = typeof work.bytes === "number" ? work.bytes : 0;
  const about = oneLine(work.description, 140);
  return pageMetadata({
    locale,
    path: `/s/${slug}`,
    title: `${title} by ${author}`,
    description: about ? `${about} — ${t.meta.work(author, bytes)}` : t.meta.work(author, bytes),
    type: "article",
  });
}

function oneLine(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/[\r\n\u2028\u2029]+/g, " ").trim().slice(0, max) : "";
}

export default async function WorkPage({ params }: Params) {
  const { slug } = await params;
  const [work, locale] = await Promise.all([getPublicWork(slug), getLocale()]);
  return (
    <>
      {work && <JsonLd data={workData(locale, work)} />}
      <WorkDetail slug={slug} initial={work} />
    </>
  );
}
