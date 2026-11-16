"use client";

import { useI18n, useSetLocale } from "@/lib/i18n/client";
import { LOCALES, type Locale } from "@/lib/i18n";

// フッターの言語の切り替え。言語の名前は、その言語で書く(読めない言語の中からでも自分の言語を探せるように)。
// 選んだ言語は Cookie に覚え、次からはブラウザの言語より優先する(lib/i18n/locale)。
const NAMES: Record<Locale, string> = { en: "English", ja: "日本語" };

export function LanguageSwitch() {
  const { locale, t } = useI18n();
  const setLocale = useSetLocale();
  return (
    <span role="group" aria-label={t.footer.language} className="flex items-baseline gap-sp-xs">
      {LOCALES.map((l, i) => (
        <span key={l} className="flex items-baseline gap-sp-xs">
          {i > 0 && <span className="text-text-muted">/</span>}
          <button
            type="button"
            lang={l}
            aria-pressed={l === locale}
            onClick={() => l !== locale && setLocale(l)}
            className={l === locale ? "text-text-primary" : "text-text-secondary hover:text-text-primary"}
          >
            {NAMES[l]}
          </button>
        </span>
      ))}
    </span>
  );
}
