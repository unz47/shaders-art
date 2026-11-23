import type { MetadataRoute } from "next";
import { LOCALES, localePath } from "@/lib/i18n/locale";
import { SITE_URL } from "@/lib/site";

// /robots.txt … API・運営・自分のページ・配信用の全画面ページ(/stage)は検索に載せない(日本語の /ja/… も同じ)。
// AI のクローラー(GPTBot・ClaudeBot など)も止めない。学習のコースを、AI の答えからも見つけてもらえるように
const PRIVATE_PATHS = ["/admin", "/me", "/stage"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", ...LOCALES.flatMap((locale) => PRIVATE_PATHS.map((path) => localePath(locale, path)))],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
