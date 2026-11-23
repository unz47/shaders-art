import type { Metadata } from "next";
import { LOCALES, type Locale, localePath } from "@/lib/i18n/locale";

// このサイトの公開オリジン(末尾の / なし)。サイトマップ・robots.txt・リンクのカード(metadataBase)で使う。
// 本番は CDK が SITE_URL を Lambda に渡す(infra/lib/nextjs-site.ts)。ビルド時や手元では本番のドメインにしておく
// (OAuth の redirect_uri は lib/server/session の siteOrigin がリクエストから組み立てるので、こちらは使わない)
export const SITE_URL = (process.env.SITE_URL ?? "https://shaders-art.com").replace(/\/+$/, "");

export const SITE_NAME = "shaders.art";

/** リンクを貼ったときのカードの画像(app/og.png/route.tsx) */
export const OG_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: SITE_NAME };

const OG_LOCALE: Record<Locale, string> = { en: "en_US", ja: "ja_JP" };

/** そのページの、言語つきの絶対 URL(トップの英語は末尾の / なしの https://shaders-art.com) */
export function absoluteUrl(locale: Locale, path: string): string {
  const localized = localePath(locale, path);
  return localized === "/" ? SITE_URL : `${SITE_URL}${localized}`;
}

/**
 * 正規の URL(canonical)と、ほかの言語の同じページ(hreflang)。英語は頭に何も付けない URL、日本語は /ja/…。
 * どちらにも当てはまらない言語の人に出すのは英語(x-default)。
 * canonical を書いておくと、告知に付けた ?utm_source=… の URL も、元のページと同じものとして扱われる
 */
export function alternatesFor(locale: Locale, path: string): Metadata["alternates"] {
  return {
    canonical: localePath(locale, path),
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [l, localePath(l, path)])),
      "x-default": path,
    },
  };
}

/**
 * ページごとの title・description・正規の URL と、リンクを貼ったときのカード。
 * openGraph は親(layout)と合わさらず丸ごと置き換わるので、サイト名と画像もここで入れ直す。
 * title には「— shaders.art」を付けない(layout の template が付ける)。トップのように付けたくないときは absoluteTitle
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  absoluteTitle = false,
  type = "website",
}: {
  locale: Locale;
  /** 言語を付けないパス(/learn など) */
  path: string;
  title: string;
  description: string;
  absoluteTitle?: boolean;
  type?: "website" | "article";
}): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} — ${SITE_NAME}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: alternatesFor(locale, path),
    openGraph: {
      siteName: SITE_NAME,
      type,
      title: fullTitle,
      description,
      url: localePath(locale, path),
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      images: [OG_IMAGE],
    },
  };
}
