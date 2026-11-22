import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/i18n/locale";
import { LESSONS } from "@/lib/learn/course";
import { isPublicWork } from "@/lib/moderation";
import { scanAllWorks } from "@/lib/server/db";
import { absoluteUrl } from "@/lib/site";

// /sitemap.xml … 検索エンジンに、決まったページ・学習の全回・公開中の作品を知らせる。
// どのページも英語(頭に何も付けない URL)と日本語(/ja/…)の 2 つを載せ、互いに別の言語の同じページだと書いておく(hreflang)。
// 作品は表から読むので、ビルド時ではなくリクエストのたびに作る(読みに来るのは検索エンジンだけで回数は少ない)
export const dynamic = "force-dynamic";

const STATIC_PATHS = ["/", "/works", "/edit", "/learn", "/terms", "/privacy"];

function entries(path: string, lastModified?: string): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(LOCALES.map((locale) => [locale, absoluteUrl(locale, path)]));
  return LOCALES.map((locale) => ({
    url: absoluteUrl(locale, path),
    ...(lastModified ? { lastModified } : {}),
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    ...STATIC_PATHS.flatMap((path) => entries(path)),
    ...LESSONS.flatMap((lesson) => entries(`/learn/${lesson.slug}`)),
  ];
  try {
    const works = (await scanAllWorks()).filter(isPublicWork);
    pages.push(...works.flatMap((work) => entries(`/s/${work.slug}`, work.createdAt)));
  } catch (error) {
    // 表が読めなくても、決まったページだけは返す
    console.error("sitemap", error);
  }
  return pages;
}
