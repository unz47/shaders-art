// 画面の言語(英語・日本語)。言語は URL で分ける(2026-11-22 の方針。それまでは同じ URL のまま Cookie と
// Accept-Language で切り替えていたが、それだと Google が英語版しか読まず、日本語の検索に載らなかった)。
//   英語   … /learn など、頭に何も付けない URL
//   日本語 … /ja/learn など、頭に /ja を付けた URL
// src/proxy.ts が /ja/… を頭を外した URL のページに回し、どちらの言語かをリクエストのヘッダー(LOCALE_HEADER)で渡す。
// 頭の無い URL に来た人のうち、Cookie(切り替えたとき)かブラウザの言語(Accept-Language)が日本語の人は /ja/… へ移す。
// /api/… には proxy を通さないので、API の言語はこれまでどおり Cookie → Accept-Language → 英語 で決める。
// サーバー(lib/i18n/server)とブラウザ(lib/i18n/client)と proxy から使うので、ここには Next の API を持ち込まない。

export const LOCALES = ["en", "ja"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
/** ヘッダーで切り替えたときに覚えておく Cookie */
export const LOCALE_COOKIE = "lang";
/** proxy が、URL から決めた言語をページに渡すリクエストのヘッダー */
export const LOCALE_HEADER = "x-shaders-locale";

/**
 * サイトの中のパス(/learn、/works?sort=new、/#top など)を、その言語の URL にする。
 * 英語はそのまま、日本語は頭に /ja を付ける。サイトの外・/api・すでに言語の付いたパスは変えない
 */
export function localePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/api/")) return path;
  if (splitLocalePath(path).locale !== null) return path;
  // トップ(/、/?…、/#…)は /ja、/ja?…、/ja#… にする(/ja/ にはしない)
  return path === "/" || path.startsWith("/?") || path.startsWith("/#") ? `/${locale}${path.slice(1)}` : `/${locale}${path}`;
}

/** URL のパスを、言語(頭の /ja。無ければ null)と、言語を外したパスに分ける */
export function splitLocalePath(pathname: string): { locale: Locale | null; path: string } {
  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    const prefix = `/${locale}`;
    if (pathname === prefix) return { locale, path: "/" };
    if (pathname.startsWith(prefix) && /^[/?#]/.test(pathname.slice(prefix.length))) {
      const rest = pathname.slice(prefix.length);
      return { locale, path: rest.startsWith("/") ? rest : `/${rest}` };
    }
  }
  return { locale: null, path: pathname };
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Accept-Language(例: "ja,en-US;q=0.9,en;q=0.8")から、対応している言語のうち一番好まれているものを選ぶ。
 * 地域の違い(en-US / en-GB など)は見ない。どれも無ければ null
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  const candidates = header
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { language: tag.toLowerCase().split("-")[0], q: q ? Number(q.slice(2)) : 1, index };
    })
    .filter((c) => c.language && Number.isFinite(c.q) && c.q > 0)
    // q が同じなら書かれた順
    .sort((a, b) => b.q - a.q || a.index - b.index);
  return candidates.map((c) => c.language).find(isLocale) ?? null;
}

export function resolveLocale({
  cookie,
  acceptLanguage,
}: {
  cookie: string | null | undefined;
  acceptLanguage: string | null | undefined;
}): Locale {
  if (isLocale(cookie)) return cookie;
  return localeFromAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE;
}
