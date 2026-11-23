import type { Dictionary, Locale } from "@/lib/i18n";
import type { LocalizedLesson } from "./localize";

// 学習の各回の description(検索結果の説明文と、リンクを貼ったときのカード)。
// 一言(summary)だけでは短いので、講座の何回目か・かかる時間と、「できるようになること」を入る分だけ続ける。
// 検索結果に出るのは英語でおよそ 160 文字・日本語でおよそ 100 文字まで。長い分は検索エンジンが切るので、少し長めに入れる。
const MAX_LENGTH: Record<Locale, number> = { en: 220, ja: 140 };

/** 本文の記法(`コード`・**強調**・[リンク](…))を外して、ただの文にする */
export function plainText(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

function sentence(text: string, locale: Locale): string {
  const plain = plainText(text).trim();
  if (locale === "ja") return /[。!?]$/.test(plain) ? plain : `${plain}。`;
  return /[.!?]$/.test(plain) ? plain : `${plain}.`;
}

export function lessonDescription(lesson: LocalizedLesson, locale: Locale, t: Dictionary): string {
  const separator = locale === "ja" ? "" : " ";
  let text = `${t.meta.lesson(lesson.number, lesson.minutes)}${separator}${sentence(lesson.summary, locale)}`;
  for (const goal of lesson.goals) {
    const next = `${text}${separator}${sentence(goal, locale)}`;
    if (next.length > MAX_LENGTH[locale]) break;
    text = next;
  }
  return text;
}
