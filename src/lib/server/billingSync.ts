import type Stripe from "stripe";
import { packExpiry } from "../billing/credits";
import { CREDIT_PACK, isCheckoutItem } from "../billing/plans";
import type { SubscriptionRecord } from "../billing/subscription";
import { addCreditPack, saveCustomerId, saveSubscription } from "./billing";
import type { StripeConfig } from "./stripe";

// Stripe での購入・契約の変化を、課金の記録(lib/server/billing)に写す(issue #42)。
// webhook(POST /api/billing/webhook)と、Checkout から戻ったとき(POST /api/billing/sync)の両方から呼ぶ。
// どちらが先に来ても、何度来ても同じ結果になるように作る:
//   契約 … 通知の中身は使わず、毎回 Stripe から今の状態を読み直して上書きする(通知の順番が前後しても最新になる)
//   追加クレジット … Checkout のセッション ID をキーにして、2 回は足さない
// どのユーザーの購入かは、Checkout を作るときに付けた client_reference_id と metadata.userId(Cognito の sub)で分かる。

const customerIdOf = (customer: string | { id: string } | null | undefined): string | null =>
  typeof customer === "string" ? customer : (customer?.id ?? null);

/** Stripe のサブスクリプションから、記録に持つ分だけを写す */
export function subscriptionRecordFrom(subscription: Stripe.Subscription, now: Date): SubscriptionRecord {
  const items = subscription.items.data;
  // API 2025-03-31 以降、期間の終わりは契約ではなく品目ごとに持つ。品目は 1 つだが、念のため一番遅いものにする
  const periodEnd = Math.max(0, ...items.map((item) => item.current_period_end));
  const interval: string | undefined = items[0]?.price.recurring?.interval;
  return {
    id: subscription.id,
    status: subscription.status,
    interval: interval === "month" || interval === "year" ? interval : null,
    currentPeriodEnd: new Date(periodEnd * 1000).toISOString(),
    cancelAtPeriodEnd: subscription.cancel_at_period_end || subscription.cancel_at !== null,
    updatedAt: now.toISOString(),
  };
}

/** 契約の今の状態を Stripe から読み直して記録する。どのユーザーのものか分からなければ何もしない */
export async function syncSubscription(config: StripeConfig, subscriptionId: string, now = new Date()): Promise<boolean> {
  const subscription = await config.stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata.userId;
  if (!userId) {
    // ダッシュボードから手で作った契約など。誰のものか分からないので、ログに残して運営が手で対応する
    console.warn(JSON.stringify({ msg: "billing-unknown-user", subscription: subscription.id }));
    return false;
  }
  await saveSubscription(userId, subscriptionRecordFrom(subscription, now), customerIdOf(subscription.customer), now);
  console.log(JSON.stringify({ msg: "billing-subscription", user: userId, status: subscription.status }));
  return true;
}

export type FulfillResult = "subscription" | "credits" | "pending" | "ignored";

/** 終わった Checkout を記録に写す。支払いがまだ(銀行振込などの非同期の支払い)なら pending */
export async function fulfillCheckoutSession(
  config: StripeConfig,
  session: Stripe.Checkout.Session,
  now = new Date(),
): Promise<FulfillResult> {
  const userId = session.client_reference_id ?? session.metadata?.userId;
  if (!userId) return "ignored";
  const customerId = customerIdOf(session.customer);

  if (session.mode === "subscription") {
    const subscriptionId = customerIdOf(session.subscription);
    if (!subscriptionId) return "pending";
    await syncSubscription(config, subscriptionId, now);
    return "subscription";
  }

  if (session.mode === "payment") {
    if (session.payment_status !== "paid") return "pending";
    const item = session.metadata?.item;
    if (!isCheckoutItem(item) || item !== "credits-500") return "ignored";
    // 有効期限は発行(記録にクレジットを足した時刻)から 6 か月。2 回目以降の呼び出しでは足さないので、最初の時刻のまま
    const purchasedAt = now;
    await addCreditPack(
      userId,
      {
        id: session.id,
        credits: CREDIT_PACK.credits,
        used: 0,
        purchasedAt: purchasedAt.toISOString(),
        expiresAt: packExpiry(purchasedAt).toISOString(),
      },
      customerId,
      now,
    );
    console.log(JSON.stringify({ msg: "billing-credits", user: userId, credits: CREDIT_PACK.credits }));
    return "credits";
  }

  if (customerId) await saveCustomerId(userId, customerId);
  return "ignored";
}
