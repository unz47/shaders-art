import { cookies, headers } from "next/headers";
import { dictionaryFor, type Dictionary, isLocale, LOCALE_COOKIE, LOCALE_HEADER, type Locale, resolveLocale } from "./index";

// サーバー(Server Component・Route Handler・generateMetadata)で、いまの依頼の言語を決める。
// ページは URL の言語(src/proxy.ts がヘッダーで渡す)。proxy を通らない /api は
// Cookie(フッターで切り替えたとき)→ Accept-Language → 英語(lib/i18n/locale)。

export async function getLocale(): Promise<Locale> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  const fromUrl = headerList.get(LOCALE_HEADER);
  if (isLocale(fromUrl)) return fromUrl;
  return resolveLocale({
    cookie: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerList.get("accept-language"),
  });
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaryFor(await getLocale());
}
