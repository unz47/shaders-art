import Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import { handleStripeWebhook, type WebhookDeps } from "./billingWebhook";

// 署名の確かめ方と、通知ごとの振り分け。Stripe には繋がない(署名は SDK のテスト用の関数で作る)。
const webhookSecret = "whsec_test_secret";
const stripe = new Stripe("sk_test_dummy");
const config = { stripe, webhookSecret, testMode: true };

function deps(): WebhookDeps & { fulfill: ReturnType<typeof vi.fn>; sync: ReturnType<typeof vi.fn> } {
  return { fulfill: vi.fn().mockResolvedValue("subscription"), sync: vi.fn().mockResolvedValue(true) };
}

async function signed(event: object) {
  const payload = JSON.stringify(event);
  const signature = await stripe.webhooks.generateTestHeaderStringAsync({ payload, secret: webhookSecret });
  return { payload, signature };
}

const checkoutEvent = {
  id: "evt_1",
  object: "event",
  type: "checkout.session.completed",
  data: { object: { id: "cs_test_1", object: "checkout.session", mode: "subscription" } },
};

describe("handleStripeWebhook", () => {
  it("署名が正しい Checkout の完了を、購入の記録に回す", async () => {
    const d = deps();
    const { payload, signature } = await signed(checkoutEvent);
    expect(await handleStripeWebhook(config, payload, signature, d)).toEqual({
      status: 200,
      handled: "checkout.session.completed",
    });
    expect(d.fulfill).toHaveBeenCalledOnce();
    expect(d.fulfill.mock.calls[0]?.[1]).toMatchObject({ id: "cs_test_1" });
  });

  it("契約の変化は、ID で Stripe から読み直す", async () => {
    const d = deps();
    const { payload, signature } = await signed({
      id: "evt_2",
      object: "event",
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_123", object: "subscription", status: "canceled" } },
    });
    expect((await handleStripeWebhook(config, payload, signature, d)).status).toBe(200);
    expect(d.sync).toHaveBeenCalledWith(config, "sub_123");
  });

  it("署名が無い・違う・本文が書き換えられたものは 400 で断り、何もしない", async () => {
    const d = deps();
    const { payload, signature } = await signed(checkoutEvent);
    expect(await handleStripeWebhook(config, payload, null, d)).toEqual({ status: 400, reason: "missing-signature" });
    expect(await handleStripeWebhook(config, payload, "t=1,v1=deadbeef", d)).toEqual({ status: 400, reason: "bad-signature" });
    expect(await handleStripeWebhook(config, payload.replace("cs_test_1", "cs_test_2"), signature, d)).toEqual({
      status: 400,
      reason: "bad-signature",
    });
    const other = await stripe.webhooks.generateTestHeaderStringAsync({ payload, secret: "whsec_other" });
    expect(await handleStripeWebhook(config, payload, other, d)).toEqual({ status: 400, reason: "bad-signature" });
    expect(d.fulfill).not.toHaveBeenCalled();
  });

  it("知らない通知は受け流す", async () => {
    const d = deps();
    const { payload, signature } = await signed({ id: "evt_3", object: "event", type: "invoice.paid", data: { object: {} } });
    expect(await handleStripeWebhook(config, payload, signature, d)).toEqual({ status: 200, handled: null });
    expect(d.fulfill).not.toHaveBeenCalled();
    expect(d.sync).not.toHaveBeenCalled();
  });

  it("処理に失敗したら 500(Stripe が送り直す)", async () => {
    const d = deps();
    d.fulfill.mockRejectedValue(new Error("DynamoDB が落ちている"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { payload, signature } = await signed(checkoutEvent);
    expect(await handleStripeWebhook(config, payload, signature, d)).toEqual({ status: 500, type: "checkout.session.completed" });
    spy.mockRestore();
  });
});
