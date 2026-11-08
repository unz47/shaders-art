import type Stripe from "stripe";
import { fulfillCheckoutSession, syncSubscription } from "./billingSync";
import type { StripeConfig } from "./stripe";

// Stripe からの通知の処理(issue #42)。Route Handler(POST /api/billing/webhook)はこれを呼ぶだけ。
// 署名の確かめ方と、どの通知で何をするかをテストできるよう、Next の外に置いてある。
// 受け取る通知(Stripe のダッシュボードで webhook の宛先を作るときに選ぶ。README の「課金」):
//   checkout.session.completed / checkout.session.async_payment_succeeded … Pro の契約・追加クレジットの購入
//   customer.subscription.created / updated / deleted / paused / resumed  … 更新・解約・支払いの失敗など
// 本文は署名の計算に使うので、JSON として読む前の文字列のまま渡すこと。

export const SUBSCRIPTION_EVENTS: ReadonlySet<string> = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
]);

export type WebhookOutcome =
  | { status: 200; handled: string | null }
  | { status: 400; reason: "missing-signature" | "bad-signature" }
  | { status: 500; type: string };

export interface WebhookDeps {
  fulfill: typeof fulfillCheckoutSession;
  sync: typeof syncSubscription;
}

const defaultDeps: WebhookDeps = { fulfill: fulfillCheckoutSession, sync: syncSubscription };

export async function handleStripeWebhook(
  config: StripeConfig & { webhookSecret: string },
  payload: string,
  signature: string | null,
  deps: WebhookDeps = defaultDeps,
): Promise<WebhookOutcome> {
  if (!signature) return { status: 400, reason: "missing-signature" };
  let event: Stripe.Event;
  try {
    event = await config.stripe.webhooks.constructEventAsync(payload, signature, config.webhookSecret);
  } catch {
    return { status: 400, reason: "bad-signature" };
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const result = await deps.fulfill(config, event.data.object);
      console.log(JSON.stringify({ msg: "billing-webhook", type: event.type, id: event.id, result }));
      return { status: 200, handled: event.type };
    }
    if (SUBSCRIPTION_EVENTS.has(event.type)) {
      // 通知の中身は古いことがある(順番が前後する)ので、ID だけ使い、今の状態は Stripe から読み直す
      await deps.sync(config, (event.data.object as Stripe.Subscription).id);
      return { status: 200, handled: event.type };
    }
    return { status: 200, handled: null };
  } catch (error) {
    // 500 を返すと、Stripe が時間を置いて送り直す(どの処理も何度来ても同じ結果になる)
    console.error("[billing/webhook]", event.type, event.id, error);
    return { status: 500, type: event.type };
  }
}
