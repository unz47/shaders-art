import type { MetadataRoute } from "next";
import { LESSONS } from "@/lib/learn/course";
import { isPublicWork } from "@/lib/moderation";
import { scanAllWorks } from "@/lib/server/db";
import { SITE_URL } from "@/lib/site";

// /sitemap.xml … 検索エンジンに、決まったページ・学習の全回・公開中の作品を知らせる。
// 作品は表から読むので、ビルド時ではなくリクエストのたびに作る(読みに来るのは検索エンジンだけで回数は少ない)
export const dynamic = "force-dynamic";

const STATIC_PATHS = ["/", "/works", "/edit", "/learn", "/terms", "/privacy"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    ...STATIC_PATHS.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...LESSONS.map((lesson) => ({ url: `${SITE_URL}/learn/${lesson.slug}` })),
  ];
  try {
    const works = (await scanAllWorks()).filter(isPublicWork);
    pages.push(...works.map((work) => ({ url: `${SITE_URL}/s/${work.slug}`, lastModified: work.createdAt })));
  } catch (error) {
    // 表が読めなくても、決まったページだけは返す
    console.error("sitemap", error);
  }
  return pages;
}
