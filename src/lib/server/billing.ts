import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { type CreditPack, consumePacks, packBalance, prunePacks, usablePacks } from "../billing/credits";
import type { BillingStatus, Plan } from "../billing/plans";
import { isSubscriptionActive, shouldReplaceSubscription, type SubscriptionRecord } from "../billing/subscription";
import { db, tableName } from "./db";
import type { Session } from "./session";

// 課金の記録(issue #42)。作品・お気に入り・AI の使用量と同じ表に、ユーザーごとに 1 行持つ。
//   billing#<ユーザー ID> … Stripe の顧客 ID、Pro の契約の写し(lib/billing/subscription)、追加クレジット(lib/billing/credits)
// 書き換えは「読む → 変える → version が読んだときのままなら書く」で行う(webhook と AI の記録が同時に来ても壊さない)。
// 決済そのもの(カード番号など)は Stripe だけが持ち、ここには持たない。

const KIND = "billing";
const MAX_ATTEMPTS = 5;

export interface BillingRecord {
  userId: string;
  stripeCustomerId: string | null;
  subscription: SubscriptionRecord | null;
  packs: CreditPack[];
  /** 楽観ロック用。書くたびに 1 増やす */
  version: number;
}

const billingKey = (userId: string) => `${KIND}#${userId}`;

function emptyRecord(userId: string): BillingRecord {
  return { userId, stripeCustomerId: null, subscription: null, packs: [], version: 0 };
}

export async function getBillingRecord(userId: string): Promise<BillingRecord> {
  const { Item } = await db.send(
    new GetCommand({ TableName: tableName(), Key: { slug: billingKey(userId) }, ConsistentRead: true }),
  );
  if (!Item) return emptyRecord(userId);
  return {
    userId,
    stripeCustomerId: typeof Item.stripeCustomerId === "string" ? Item.stripeCustomerId : null,
    subscription: (Item.subscription as SubscriptionRecord | undefined) ?? null,
    packs: Array.isArray(Item.packs) ? (Item.packs as CreditPack[]) : [],
    version: typeof Item.version === "number" ? Item.version : 0,
  };
}

/**
 * 記録を書き換える。change が null を返したら何もしない。ほかの書き込みとぶつかったら読み直してやり直す。
 * 書き換えた後の記録(何もしなかったら今の記録)を返す
 */
export async function updateBillingRecord(
  userId: string,
  change: (record: BillingRecord) => BillingRecord | null,
): Promise<BillingRecord> {
  for (let attempt = 1; ; attempt++) {
    const current = await getBillingRecord(userId);
    const next = change(current);
    if (!next) return current;
    const written = { ...next, version: current.version + 1 };
    try {
      await db.send(
        new PutCommand({
          TableName: tableName(),
          Item: {
            slug: billingKey(userId),
            kind: KIND,
            userId,
            stripeCustomerId: written.stripeCustomerId,
            subscription: written.subscription,
            packs: written.packs,
            version: written.version,
          },
          ConditionExpression: current.version === 0 ? "attribute_not_exists(slug)" : "version = :version",
          ...(current.version === 0 ? {} : { ExpressionAttributeValues: { ":version": current.version } }),
        }),
      );
      return written;
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException && attempt < MAX_ATTEMPTS) continue;
      throw error;
    }
  }
}

/** Stripe の顧客 ID を覚える(Checkout で作られた顧客を、次の購入と契約の管理画面で使い回す) */
export function saveCustomerId(userId: string, customerId: string): Promise<BillingRecord> {
  return updateBillingRecord(userId, (record) =>
    record.stripeCustomerId === customerId ? null : { ...record, stripeCustomerId: customerId },
  );
}

/** 契約の写しを上書きする(lib/billing/subscription の shouldReplaceSubscription で、古い契約の通知は弾く) */
export function saveSubscription(
  userId: string,
  subscription: SubscriptionRecord,
  customerId: string | null,
  now = new Date(),
): Promise<BillingRecord> {
  return updateBillingRecord(userId, (record) => {
    if (!shouldReplaceSubscription(record.subscription, subscription, now)) return null;
    return { ...record, subscription, stripeCustomerId: customerId ?? record.stripeCustomerId };
  });
}

/** 追加クレジットを足す。同じ購入(Checkout のセッション ID)は 2 回足さない(webhook が何度来ても同じ結果になる) */
/** 追加クレジットを足す。同じ決済(戻ってきたときの同期と webhook の両方から来る)は 1 回だけ足し、足したら true */
export async function addCreditPack(
  userId: string,
  pack: CreditPack,
  customerId: string | null,
  now = new Date(),
): Promise<boolean> {
  let added = false;
  await updateBillingRecord(userId, (record) => {
    added = !record.packs.some((p) => p.id === pack.id);
    if (!added) return null;
    return {
      ...record,
      stripeCustomerId: customerId ?? record.stripeCustomerId,
      packs: [...prunePacks(record.packs, now), pack],
    };
  });
  return added;
}

/** 追加クレジットから引く。引けなかった量(残高を超えた分)を返す */
export async function deductPackCredits(userId: string, amount: number, now = new Date()): Promise<number> {
  if (amount <= 0) return 0;
  let unpaid = 0;
  await updateBillingRecord(userId, (record) => {
    const result = consumePacks(record.packs, amount, now);
    unpaid = result.unpaid;
    if (result.unpaid === amount) return null;
    return { ...record, packs: result.packs };
  });
  return unpaid;
}

/** 運営(AI_UNLIMITED_EMAILS)か。運営は払わなくても Pro と同じに使える */
export function isOperator(session: Session, operatorEmails: readonly string[]): boolean {
  return session.email !== null && operatorEmails.includes(session.email.toLowerCase());
}

export interface ViewerBilling {
  plan: Plan;
  operator: boolean;
  record: BillingRecord;
  /** 使える追加クレジットの合計 */
  packCredits: number;
}

export async function getViewerBilling(
  session: Session,
  operatorEmails: readonly string[],
  now = new Date(),
): Promise<ViewerBilling> {
  const record = await getBillingRecord(session.sub);
  const operator = isOperator(session, operatorEmails);
  const pro = operator || isSubscriptionActive(record.subscription, now);
  return { plan: pro ? "pro" : "free", operator, record, packCredits: packBalance(record.packs, now) };
}

/** GET /api/billing/status の形にする */
export function toBillingStatus(
  viewer: ViewerBilling | null,
  stripe: { configured: boolean; testMode: boolean },
  now = new Date(),
): BillingStatus {
  const { configured, testMode } = stripe;
  if (!viewer) return { configured, testMode, signedIn: false, plan: "free", operator: false, subscription: null, packs: [] };
  const sub = viewer.record.subscription;
  return {
    configured,
    testMode,
    signedIn: true,
    plan: viewer.plan,
    operator: viewer.operator,
    subscription: sub
      ? {
          interval: sub.interval,
          status: sub.status,
          currentPeriodEnd: sub.currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        }
      : null,
    packs: usablePacks(viewer.record.packs, now).map((pack) => ({
      credits: pack.credits - pack.used,
      expiresAt: pack.expiresAt,
    })),
  };
}
