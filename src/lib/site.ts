import type { Metadata } from "next";

// このサイトの公開オリジン(末尾の / なし)。サイトマップ・robots.txt・リンクのカード(metadataBase)で使う。
// 本番は CDK が SITE_URL を Lambda に渡す(infra/lib/nextjs-site.ts)。ビルド時や手元では本番のドメインにしておく
// (OAuth の redirect_uri は lib/server/session の siteOrigin がリクエストから組み立てるので、こちらは使わない)
export const SITE_URL = (process.env.SITE_URL ?? "https://shaders-art.com").replace(/\/+$/, "");

/** リンクを貼ったときのカードの画像(app/og.png/route.tsx) */
export const OG_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: "shaders.art" };

/**
 * ページごとの title・description と、リンクを貼ったときのカード。openGraph は親(layout)と合わさらず
 * 丸ごと置き換わるので、サイト名もここで入れ直す。title には「— shaders.art」を付けない(layout の template が付ける)
 */
export function pageMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    openGraph: { siteName: "shaders.art", type: "website", title: `${title} — shaders.art`, description, images: [OG_IMAGE] },
  };
}
