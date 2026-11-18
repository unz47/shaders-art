import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// /robots.txt … API・運営・自分のページ・配信用の全画面ページ(/stage)は検索に載せない
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/me", "/stage"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
