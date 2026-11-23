// Pro の契約の状態(issue #42)。Stripe のサブスクリプションから必要な分だけを写して、DynamoDB の課金の行に持つ
// (lib/server/billing)。Pro かどうかは、毎回 Stripe に問い合わせずにこの写しで決める。
// 写しは webhook(と Checkout から戻ったとき)に、Stripe から読み直した最新の状態で上書きする。

export interface SubscriptionRecord {
  /** Stripe のサブスクリプション ID(sub_…) */
  id: string;
  /** Stripe の状態。active / trialing / past_due / canceled / unpaid / incomplete / incomplete_expired / paused */
  status: string;
  interval: "month" | "year" | null;
  /** 今の期間が終わる時刻(ISO) */
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  /** 写した時刻(ISO) */
  updatedAt: string;
}

/**
 * Pro として扱う状態。past_due(更新の支払いに失敗し、Stripe が再試行している間)も、再試行が終わるまでは Pro のままにする
 * (カードの期限切れなどで急に使えなくなるのを避ける。再試行が尽きれば Stripe が canceled か unpaid にする)
 */
const PRO_STATUSES = new Set(["active", "trialing", "past_due"]);

export function isSubscriptionActive(subscription: SubscriptionRecord | null | undefined, now: Date): boolean {
  if (!subscription || !PRO_STATUSES.has(subscription.status)) return false;
  // 期間の終わりを過ぎても更新の通知が遅れることがあるので、1 日は猶予する
  const graceMs = 24 * 60 * 60 * 1000;
  return new Date(subscription.currentPeriodEnd).getTime() + graceMs > now.getTime();
}

/**
 * 届いたサブスクリプションで、記録を上書きしてよいか。ふつうは同じ ID なので上書きする。
 * 違う ID(2 つ目の契約が作られた、昔の契約の通知が遅れて届いた)のときは、今の記録が有効なら、
 * 有効でない契約の通知では上書きしない(解約済みの古い契約で、今の Pro が消えないように)
 */
export function shouldReplaceSubscription(
  current: SubscriptionRecord | null | undefined,
  incoming: SubscriptionRecord,
  now: Date,
): boolean {
  if (!current || current.id === incoming.id) return true;
  if (!isSubscriptionActive(current, now)) return true;
  return isSubscriptionActive(incoming, now);
}
