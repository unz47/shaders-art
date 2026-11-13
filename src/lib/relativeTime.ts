import type { Dictionary } from "@/lib/i18n";

// 一覧のカードの「12 分前」「3 時間前」「昨日」(英語なら "12 minutes ago" など)。30 日を超えたら日付にする。

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTime(iso: string, now: number, t: Dictionary["time"]): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "";
  const diff = now - time;
  if (diff < MINUTE) return t.justNow;
  const relative = new Intl.RelativeTimeFormat(t.intl, { numeric: "auto" });
  if (diff < HOUR) return relative.format(-Math.floor(diff / MINUTE), "minute");
  if (diff < DAY) return relative.format(-Math.floor(diff / HOUR), "hour");
  if (diff < 30 * DAY) return relative.format(-Math.floor(diff / DAY), "day");
  return new Date(time).toLocaleDateString(t.intl);
}
