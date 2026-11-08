import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

// 購入を記録に写す処理。DynamoDB(./billing)と Stripe は偽物に差し替える。
vi.mock("./billing", () => ({
  addCreditPack: vi.fn().mockResolvedValue(true),
  saveCustomerId: vi.fn().mockResolvedValue(undefined),
  saveSubscription: vi.fn().mockResolvedValue(undefined),
}));

const billing = await import("./billing");
const { fulfillCheckoutSession, subscriptionRecordFrom, syncSubscription } = await import("./billingSync");

const now = new Date("2026-11-08T00:00:00Z");

function fakeSubscription(overrides: Partial<Stripe.Subscription> = {}): Stripe.Subscription {
  return {
    id: "sub_1",
    status: "active",
    customer: "cus_1",
    cancel_at_period_end: false,
    cancel_at: null,
    metadata: { userId: "user-1" },
    items: {
      data: [{ current_period_end: 1_796_688_000, price: { recurring: { interval: "month" } } }],
    },
    ...overrides,
  } as unknown as Stripe.Subscription;
}

function fakeConfig(subscription = fakeSubscription()) {
  return {
    stripe: { subscriptions: { retrieve: vi.fn().mockResolvedValue(subscription) } } as unknown as Stripe,
    webhookSecret: "whsec",
    testMode: true,
  };
}

const session = (overrides: Partial<Stripe.Checkout.Session>) =>
  ({
    id: "cs_test_1",
    client_reference_id: "user-1",
    customer: "cus_1",
    metadata: {},
    created: Math.floor(now.getTime() / 1000),
    ...overrides,
  }) as unknown as Stripe.Checkout.Session;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("subscriptionRecordFrom", () => {
  it("期間の終わり(品目ごとに持つ)・間隔・解約の予定を写す", () => {
    expect(subscriptionRecordFrom(fakeSubscription({ cancel_at_period_end: true }), now)).toEqual({
      id: "sub_1",
      status: "active",
      interval: "month",
      currentPeriodEnd: new Date(1_796_688_000 * 1000).toISOString(),
      cancelAtPeriodEnd: true,
      updatedAt: now.toISOString(),
    });
  });

  it("日付を指定した解約(cancel_at)も、解約の予定として扱う", () => {
    expect(subscriptionRecordFrom(fakeSubscription({ cancel_at: 1_796_688_000 }), now).cancelAtPeriodEnd).toBe(true);
  });
});

describe("syncSubscription", () => {
  it("Stripe から読み直した状態を、metadata の userId の人の記録に書く", async () => {
    const config = fakeConfig();
    expect(await syncSubscription(config, "sub_1", now)).toBe(true);
    expect(config.stripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_1");
    expect(billing.saveSubscription).toHaveBeenCalledWith("user-1", expect.objectContaining({ id: "sub_1" }), "cus_1", now);
  });

  it("誰のものか分からない契約は書かない", async () => {
    const config = fakeConfig(fakeSubscription({ metadata: {} }));
    expect(await syncSubscription(config, "sub_1", now)).toBe(false);
    expect(billing.saveSubscription).not.toHaveBeenCalled();
  });
});

describe("fulfillCheckoutSession", () => {
  it("Pro の契約は、サブスクリプションを読み直して記録する", async () => {
    const result = await fulfillCheckoutSession(fakeConfig(), session({ mode: "subscription", subscription: "sub_1" }), now);
    expect(result).toBe("subscription");
    expect(billing.saveSubscription).toHaveBeenCalledOnce();
  });

  it("追加クレジットは、セッション ID をキーに 6 か月の期限で足す", async () => {
    const result = await fulfillCheckoutSession(
      fakeConfig(),
      session({ mode: "payment", payment_status: "paid", metadata: { userId: "user-1", item: "credits-500" } }),
      now,
    );
    expect(result).toBe("credits");
    expect(billing.addCreditPack).toHaveBeenCalledWith(
      "user-1",
      {
        id: "cs_test_1",
        credits: 500,
        used: 0,
        purchasedAt: "2026-11-08T00:00:00.000Z",
        expiresAt: "2027-05-08T00:00:00.000Z",
      },
      "cus_1",
      now,
    );
  });

  it("支払いが済んでいなければ(非同期の支払い)まだ足さない", async () => {
    const result = await fulfillCheckoutSession(
      fakeConfig(),
      session({ mode: "payment", payment_status: "unpaid", metadata: { item: "credits-500" } }),
      now,
    );
    expect(result).toBe("pending");
    expect(billing.addCreditPack).not.toHaveBeenCalled();
  });

  it("知らない品目や、誰のものか分からない購入は無視する", async () => {
    expect(
      await fulfillCheckoutSession(fakeConfig(), session({ mode: "payment", payment_status: "paid", metadata: { item: "x" } }), now),
    ).toBe("ignored");
    expect(
      await fulfillCheckoutSession(fakeConfig(), session({ client_reference_id: null, mode: "subscription", subscription: "sub_1" }), now),
    ).toBe("ignored");
    expect(billing.addCreditPack).not.toHaveBeenCalled();
    expect(billing.saveSubscription).not.toHaveBeenCalled();
  });
});
