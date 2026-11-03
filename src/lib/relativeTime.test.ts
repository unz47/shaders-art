import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./relativeTime";

const now = Date.parse("2026-10-22T12:00:00Z");
const ago = (ms: number) => new Date(now - ms).toISOString();

describe("formatRelativeTime", () => {
  it("1 分未満は「たった今」", () => {
    expect(formatRelativeTime(ago(30_000), now)).toBe("たった今");
  });

  it("1 時間未満は分、1 日未満は時間", () => {
    expect(formatRelativeTime(ago(12 * 60_000), now)).toBe("12 分前");
    expect(formatRelativeTime(ago(3 * 3_600_000 + 59 * 60_000), now)).toBe("3 時間前");
  });

  it("30 日未満は日(1 日前は「昨日」)", () => {
    expect(formatRelativeTime(ago(26 * 3_600_000), now)).toBe("昨日");
    expect(formatRelativeTime(ago(12 * 86_400_000), now)).toBe("12 日前");
  });

  it("30 日を超えたら日付、読めなければ空", () => {
    expect(formatRelativeTime("2026-09-15", now)).toBe(new Date("2026-09-15").toLocaleDateString("ja-JP"));
    expect(formatRelativeTime("not a date", now)).toBe("");
  });
});
