import { describe, expect, it } from "vitest";
import { isSubscriptionActive, shouldReplaceSubscription, type SubscriptionRecord } from "./subscription";

const now = new Date("2026-11-08T00:00:00Z");
const sub = (id: string, status: string, currentPeriodEnd = "2026-12-08T00:00:00.000Z"): SubscriptionRecord => ({
  id,
  status,
  interval: "month",
  currentPeriodEnd,
  cancelAtPeriodEnd: false,
  updatedAt: now.toISOString(),
});

describe("isSubscriptionActive", () => {
  it("有効・お試し・支払いの再試行中は Pro", () => {
    expect(isSubscriptionActive(sub("a", "active"), now)).toBe(true);
    expect(isSubscriptionActive(sub("a", "trialing"), now)).toBe(true);
    expect(isSubscriptionActive(sub("a", "past_due"), now)).toBe(true);
  });

  it("解約済み・未払いは Pro でない", () => {
    expect(isSubscriptionActive(sub("a", "canceled"), now)).toBe(false);
    expect(isSubscriptionActive(sub("a", "unpaid"), now)).toBe(false);
    expect(isSubscriptionActive(sub("a", "incomplete"), now)).toBe(false);
    expect(isSubscriptionActive(null, now)).toBe(false);
  });

  it("期間の終わりから 1 日は猶予し、それを過ぎたら Pro でない(更新の通知が届かなかったとき)", () => {
    expect(isSubscriptionActive(sub("a", "active", "2026-11-07T12:00:00.000Z"), now)).toBe(true);
    expect(isSubscriptionActive(sub("a", "active", "2026-11-06T00:00:00.000Z"), now)).toBe(false);
  });
});

describe("shouldReplaceSubscription", () => {
  it("記録が無いか、同じ契約なら上書きする", () => {
    expect(shouldReplaceSubscription(null, sub("a", "active"), now)).toBe(true);
    expect(shouldReplaceSubscription(sub("a", "active"), sub("a", "canceled"), now)).toBe(true);
  });

  it("今の契約が有効なら、別の契約の解約の通知では上書きしない", () => {
    expect(shouldReplaceSubscription(sub("new", "active"), sub("old", "canceled"), now)).toBe(false);
  });

  it("今の契約が終わっていれば、別の契約で上書きする", () => {
    expect(shouldReplaceSubscription(sub("old", "canceled"), sub("new", "active"), now)).toBe(true);
  });
});
