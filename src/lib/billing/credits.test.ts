import { describe, expect, it } from "vitest";
import { type CreditPack, consumePacks, overflowCredits, packBalance, packExpiry, prunePacks, usablePacks } from "./credits";

const pack = (id: string, credits: number, used: number, expiresAt: string, purchasedAt = "2026-01-01T00:00:00.000Z"): CreditPack => ({
  id,
  credits,
  used,
  purchasedAt,
  expiresAt,
});
const now = new Date("2026-11-08T00:00:00Z");

describe("packExpiry", () => {
  it("6 か月後の同じ日時", () => {
    expect(packExpiry(new Date("2026-11-08T03:00:00Z")).toISOString()).toBe("2027-05-08T03:00:00.000Z");
  });

  it("その月に同じ日が無ければ、月末にする(6 か月を超えないように)", () => {
    expect(packExpiry(new Date("2026-08-31T00:00:00Z")).toISOString()).toBe("2027-02-28T00:00:00.000Z");
  });
});

describe("usablePacks / packBalance", () => {
  const packs = [
    pack("late", 500, 0, "2027-04-01T00:00:00.000Z"),
    pack("used-up", 500, 500, "2027-01-01T00:00:00.000Z"),
    pack("expired", 500, 100, "2026-11-01T00:00:00.000Z"),
    pack("soon", 500, 200, "2026-12-01T00:00:00.000Z"),
  ];

  it("使い切ったもの・期限切れを除き、期限の早い順に並べる", () => {
    expect(usablePacks(packs, now).map((p) => p.id)).toEqual(["soon", "late"]);
  });

  it("残りの合計", () => {
    expect(packBalance(packs, now)).toBe(300 + 500);
  });
});

describe("overflowCredits", () => {
  it("枠の中なら 0", () => {
    expect(overflowCredits(10, 20, 40)).toBe(0);
  });

  it("枠をまたいだ依頼は、超えた分だけ", () => {
    expect(overflowCredits(35, 45, 40)).toBe(5);
  });

  it("すでに枠を超えていれば、全部", () => {
    expect(overflowCredits(50, 57, 40)).toBe(7);
  });
});

describe("consumePacks", () => {
  it("期限の早いものから引く", () => {
    const packs = [pack("late", 500, 0, "2027-04-01T00:00:00.000Z"), pack("soon", 500, 490, "2026-12-01T00:00:00.000Z")];
    const result = consumePacks(packs, 30, now);
    expect(result.unpaid).toBe(0);
    expect(result.packs.find((p) => p.id === "soon")?.used).toBe(500);
    expect(result.packs.find((p) => p.id === "late")?.used).toBe(20);
  });

  it("足りなければ引けるだけ引き、残りを返す", () => {
    const result = consumePacks([pack("a", 500, 495, "2027-01-01T00:00:00.000Z")], 8, now);
    expect(result.unpaid).toBe(3);
    expect(result.packs[0]?.used).toBe(500);
  });

  it("期限切れからは引かない", () => {
    const result = consumePacks([pack("old", 500, 0, "2026-11-01T00:00:00.000Z")], 5, now);
    expect(result.unpaid).toBe(5);
    expect(result.packs[0]?.used).toBe(0);
  });
});

describe("prunePacks", () => {
  it("失効から 1 年たったものだけ外す", () => {
    const packs = [pack("keep", 500, 0, "2026-01-01T00:00:00.000Z"), pack("drop", 500, 0, "2025-10-01T00:00:00.000Z")];
    expect(prunePacks(packs, now).map((p) => p.id)).toEqual(["keep"]);
  });
});
