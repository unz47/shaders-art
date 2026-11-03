import { describe, expect, it } from "vitest";
import { getAiLimits } from "./aiUsage";

describe("getAiLimits", () => {
  it("環境変数が無ければ既定(月 40 クレジット・1 日 20 回)", () => {
    expect(getAiLimits({})).toEqual({ monthlyCredits: 40, dailyRequests: 20, unlimitedEmails: [] });
  });

  it("上限と、上限なしの人(メールアドレスは小文字にそろえる)を変えられる", () => {
    expect(
      getAiLimits({ AI_MONTHLY_CREDITS: "600", AI_DAILY_REQUESTS: "50", AI_UNLIMITED_EMAILS: " Owner@Example.com, ,b@example.com" }),
    ).toEqual({ monthlyCredits: 600, dailyRequests: 50, unlimitedEmails: ["owner@example.com", "b@example.com"] });
  });

  it("読めない値は既定に戻す", () => {
    expect(getAiLimits({ AI_MONTHLY_CREDITS: "abc", AI_DAILY_REQUESTS: "0" })).toMatchObject({ monthlyCredits: 40, dailyRequests: 20 });
  });
});
