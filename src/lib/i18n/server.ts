import { cookies, headers } from "next/headers";
import { dictionaryFor, type Dictionary, LOCALE_COOKIE, type Locale, resolveLocale } from "./index";

// サーバー(Server Component・Route Handler・generateMetadata)で、いまの依頼の言語を決める。
// Cookie(ヘッダーやフッターで切り替えたとき)→ Accept-Language → 英語(lib/i18n/locale)。

export async function getLocale(): Promise<Locale> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  return resolveLocale({
    cookie: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerList.get("accept-language"),
  });
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaryFor(await getLocale());
}
