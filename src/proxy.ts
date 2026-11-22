import { type NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  localePath,
  resolveLocale,
  splitLocalePath,
} from "@/lib/i18n/locale";

// 言語ごとの URL(lib/i18n/locale)。ページを描く前に、URL から言語を決めてページに渡す。
//   /ja/…      … 頭の /ja を外した URL のページを、日本語で描く(URL はそのまま)
//   頭の無い URL … 英語で描く。ただし Cookie かブラウザの言語が日本語の人は /ja/… へ移す
//                (Googlebot は言語を送ってこないので、英語のページをそのまま読む)
// /stage は配信ソフトや他のサイトに埋め込んで使うので、URL を変えないよう移さない。

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { locale, path } = splitLocalePath(pathname);
  const headers = new Headers(request.headers);

  if (locale) {
    headers.set(LOCALE_HEADER, locale);
    const url = request.nextUrl.clone();
    url.pathname = path;
    return NextResponse.rewrite(url, { request: { headers } });
  }

  const preferred = resolveLocale({
    cookie: request.cookies.get(LOCALE_COOKIE)?.value,
    acceptLanguage: request.headers.get("accept-language"),
  });
  if (preferred !== DEFAULT_LOCALE && (request.method === "GET" || request.method === "HEAD") && !isStage(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = localePath(preferred, pathname);
    const response = NextResponse.redirect(url, 307);
    // 見る人によって行き先が変わるので、CloudFront やブラウザに覚えさせない
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  headers.set(LOCALE_HEADER, DEFAULT_LOCALE);
  return NextResponse.next({ request: { headers } });
}

function isStage(pathname: string): boolean {
  return pathname === "/stage" || pathname.startsWith("/stage/");
}

export const config = {
  // ページだけに通す。/api・Next のファイル(/_next)・拡張子の付いたファイル(/og.png、/robots.txt、/sitemap.xml、
  // /llms.txt、/icon.svg など)は通さない
  matcher: ["/((?!api/|_next/|.*\\.[A-Za-z0-9]+$).*)"],
};
