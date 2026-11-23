"use client";

import { usePathname } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useMemo } from "react";
import { dictionaryFor, type Dictionary, LOCALE_COOKIE, type Locale, localePath, splitLocalePath } from "./index";

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

/** サイトの中のパスを、いま見ている言語の URL にする(/learn → 日本語なら /ja/learn)。リンクは components/Link が使う */
export function useLocalize(): (path: string) => string {
  const { locale } = useI18n();
  return useCallback((path: string) => localePath(locale, path), [locale]);
}

/** いまのページのパスから言語(頭の /ja)を外したもの。ナビの現在地の判定などに使う */
export function usePagePath(): string {
  return splitLocalePath(usePathname()).path;
}

/**
 * 言語を切り替える。Cookie に 1 年覚えておき(頭の無い URL に来たときの行き先になる)、同じページの
 * その言語の URL を開き直す。html の lang やルートレイアウトの文言も変わるので、画面の中の移動ではなく読み込み直す
 */
export function useSetLocale(): (locale: Locale) => void {
  return useCallback((locale: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    const { path } = splitLocalePath(window.location.pathname);
    window.location.assign(localePath(locale, path) + window.location.search + window.location.hash);
  }, []);
}
