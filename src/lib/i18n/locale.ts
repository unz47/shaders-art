// 画面の言語(英語・日本語)。URL には入れず、Cookie(切り替えたとき)→ ブラウザの言語(Accept-Language)
// → 英語 の順で決める(2026-10-29 の方針)。同じ URL でも、見る人の言語で表示する。
// サーバー(lib/i18n/server)とブラウザ(lib/i18n/client)の両方から使うので、ここには Next の API を持ち込まない。

export const LOCALES = ["en", "ja"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
/** ヘッダーで切り替えたときに覚えておく Cookie */
export const LOCALE_COOKIE = "lang";

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
