"use client";

import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useMemo } from "react";
import { dictionaryFor, type Dictionary, LOCALE_COOKIE, type Locale } from "./index";

// ブラウザ側で文言を引く。言語はルートレイアウトがサーバーで決めて I18nProvider に渡す
// (ハイドレーションで食い違わないよう、ブラウザでは決め直さない)。
// 文言の辞書には引数を取る関数も入っているので、サーバーから props で渡さず、ここで読み込む。

const I18nContext = createContext<{ locale: Locale; t: Dictionary } | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo(() => ({ locale, t: dictionaryFor(locale) }), [locale]);
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n(): { locale: Locale; t: Dictionary } {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n は I18nProvider の中で使う");
  return value;
}

/** 言語を切り替える。Cookie に 1 年覚えておき、サーバーで描く部分(タイトルや html の lang)も描き直す */
export function useSetLocale(): (locale: Locale) => void {
  const router = useRouter();
  return useCallback(
    (locale: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      router.refresh();
    },
    [router],
  );
}
