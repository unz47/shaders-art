import { describe, expect, it } from "vitest";
import { aiCostUsd, type AiUsageStatus, creditsForCost, quotaBlock, usagePeriods } from "./aiQuota";

describe("aiCostUsd / creditsForCost", () => {
  it("原価はモデルの値段とトークンの数から出す", () => {
    // Qwen3 Coder 480B: 入力 $0.54・出力 $2.18 / 100 万トークン
    expect(aiCostUsd("qwen.qwen3-coder-480b-a35b-v1:0", { inputTokens: 1_000_000, outputTokens: 0 })).toBeCloseTo(0.54);
    expect(aiCostUsd("qwen.qwen3-coder-480b-a35b-v1:0", { inputTokens: 0, outputTokens: 1_000_000 })).toBeCloseTo(2.18);
  });

  it("安い依頼でも 1 クレジット、Sonnet 4.6 の重い依頼は 10 クレジットほど", () => {
    expect(creditsForCost(aiCostUsd("qwen.qwen3-coder-480b-a35b-v1:0", { inputTokens: 771, outputTokens: 319 }))).toBe(1);
    // 実測: 入力 1,396・出力 1,858 → 約 $0.035 → ¥5.3 → 11 クレジット
    expect(creditsForCost(aiCostUsd("jp.anthropic.claude-sonnet-4-6", { inputTokens: 1396, outputTokens: 1858 }))).toBe(11);
  });

  it("一覧に無いモデルは、いちばん高いモデルの値段で数える", () => {
    const tokens = { inputTokens: 1000, outputTokens: 1000 };
    expect(aiCostUsd("anthropic.claude-opus-4-8", tokens)).toBeCloseTo(aiCostUsd("claude-opus-5-5", tokens));
  });
});

describe("usagePeriods", () => {
  it("日本時間で区切る(UTC では 10 月 31 日でも、日本時間では 11 月 1 日)", () => {
    expect(usagePeriods(new Date("2026-10-31T15:30:00Z"))).toEqual({
      month: "2026-11",
      day: "2026-11-01",
      monthResetsAt: "2026-11-30T15:00:00.000Z",
      dayResetsAt: "2026-11-01T15:00:00.000Z",
    });
  });

  it("12 月の次は翌年の 1 月", () => {
    expect(usagePeriods(new Date("2026-12-31T14:00:00Z")).monthResetsAt).toBe("2026-12-31T15:00:00.000Z");
  });
});

describe("quotaBlock", () => {
  const status = (credits: number, requests: number, unlimited = false): AiUsageStatus => ({
    credits: { used: credits, limit: 40 },
    requestsToday: { used: requests, limit: 20 },
    unlimited,
    monthResetsAt: "",
    dayResetsAt: "",
  });

  it("月のクレジットか 1 日の回数のどちらかに達したら止める", () => {
    expect(quotaBlock(status(39, 19))).toBeNull();
    expect(quotaBlock(status(40, 0))).toBe("monthly");
    expect(quotaBlock(status(0, 20))).toBe("daily");
  });

  it("上限なしの人は止めない", () => {
    expect(quotaBlock(status(999, 999, true))).toBeNull();
  });
});
