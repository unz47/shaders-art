import { en } from "./en";
import { type Dictionary, ja } from "./ja";
import type { Locale } from "./locale";

export * from "./locale";
export type { Dictionary };

const DICTIONARIES: Record<Locale, Dictionary> = { en, ja };

/** その言語の文言。サーバーでは lib/i18n/server の getDictionary、ブラウザでは useI18n を使う */
export function dictionaryFor(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
