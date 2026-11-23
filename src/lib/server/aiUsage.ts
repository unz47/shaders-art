import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import {
  type AiUsageStatus,
  DEFAULT_DAILY_REQUESTS,
  DEFAULT_MONTHLY_CREDITS,
  JPY_PER_USD,
  usagePeriods,
} from "../aiQuota";
import { overflowCredits } from "../billing/credits";
import { DEFAULT_PRO_DAILY_REQUESTS, DEFAULT_PRO_MONTHLY_CREDITS } from "../billing/plans";
import { deductPackCredits, getViewerBilling } from "./billing";
import { db, tableName } from "./db";
import type { Session } from "./session";

// AI の使用量(issue #43)。作品・お気に入りと同じ表に、ユーザーごと・月ごと・日ごとの行として入れる。
//   ai-usage#<ユーザー ID>#2026-11     … その月の依頼の回数・クレジット・原価
//   ai-usage#<ユーザー ID>#2026-11-01  … その日の依頼の回数・クレジット・原価
//   ai-usage#free#2026-11             … 無料の人全体の、その月の合計(運営など上限なしの人は含めない)
// 回数は依頼を受けた時点で、クレジットと原価は答えが返った(途中で切れた・断られたも含む)時点で足す。
// 利用者が途中で止めた依頼は、使ったトークンの数が届かないので、時間から見積もった分を数える(lib/server/ai)。
// 古い行は TTL(expiresAt。infra の WorksTable)で消す。原価は CloudWatch Logs の "ai-edit" でも見られる。
// 上限はプラン(lib/server/billing)で変わる。月の枠を超えた分は、記録した後に追加クレジットから引く(chargeAiCost)。

const KIND = "ai-usage";
const DAY_TTL_SECONDS = 8 * 24 * 60 * 60;
const MONTH_TTL_SECONDS = 400 * 24 * 60 * 60;
/** 無料の人全体の合計の行。ユーザー ID(Cognito の sub)は UUID なので重ならない */
const FREE_POOL = "free";
/** 無料の人全体の、1 か月の原価の上限の既定(円)。今の AWS の固定費(月 ¥1,500 ほど)の倍 */
export const DEFAULT_FREE_MONTHLY_BUDGET_YEN = 3000;

export interface AiLimits {
  monthlyCredits: number;
  dailyRequests: number;
  /** Pro の上限(issue #42) */
  proMonthlyCredits: number;
  proDailyRequests: number;
  /** 無料の人全体の、1 か月の原価の上限(円) */
  freeMonthlyBudgetYen: number;
  /** 上限なしで使える人(運営)。小文字のメールアドレス */
  unlimitedEmails: string[];
}

/** 上限は環境変数で変えられる。読めない値なら既定に戻す */
export function getAiLimits(env: Record<string, string | undefined> = process.env): AiLimits {
  return {
    monthlyCredits: positiveInt(env.AI_MONTHLY_CREDITS) ?? DEFAULT_MONTHLY_CREDITS,
    dailyRequests: positiveInt(env.AI_DAILY_REQUESTS) ?? DEFAULT_DAILY_REQUESTS,
    proMonthlyCredits: positiveInt(env.AI_PRO_MONTHLY_CREDITS) ?? DEFAULT_PRO_MONTHLY_CREDITS,
    proDailyRequests: positiveInt(env.AI_PRO_DAILY_REQUESTS) ?? DEFAULT_PRO_DAILY_REQUESTS,
    freeMonthlyBudgetYen: positiveInt(env.AI_FREE_MONTHLY_BUDGET_YEN) ?? DEFAULT_FREE_MONTHLY_BUDGET_YEN,
    unlimitedEmails: (env.AI_UNLIMITED_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  };
}

function positiveInt(value: string | undefined): number | null {
  const n = Number(value);
  return value && Number.isInteger(n) && n > 0 ? n : null;
}

const usageKey = (userId: string, period: string) => `${KIND}#${userId}#${period}`;

async function readCounter(key: string, field: "credits" | "requests" | "costMicroUsd"): Promise<number> {
  const { Item } = await db.send(
    new GetCommand({
      TableName: tableName(),
      Key: { slug: key },
      ConsistentRead: true,
      ProjectionExpression: "#f",
      ExpressionAttributeNames: { "#f": field },
    }),
  );
  return typeof Item?.[field] === "number" ? Item[field] : 0;
}

/** 無料の人全体の今月の原価(100 万分の 1 ドル単位)が、上限(円)に達したか */
export function isFreePoolExhausted(costMicroUsd: number, budgetYen: number): boolean {
  return (costMicroUsd / 1_000_000) * JPY_PER_USD >= budgetYen;
}

export async function getAiUsage(session: Session, limits: AiLimits, now = new Date()): Promise<AiUsageStatus> {
  const periods = usagePeriods(now);
  const [credits, requests, poolCost, billing] = await Promise.all([
    readCounter(usageKey(session.sub, periods.month), "credits"),
    readCounter(usageKey(session.sub, periods.day), "requests"),
    readCounter(usageKey(FREE_POOL, periods.month), "costMicroUsd"),
    getViewerBilling(session, limits.unlimitedEmails, now),
  ]);
  const unlimited = billing.operator;
  const pro = billing.plan === "pro";
  return {
    plan: billing.plan,
    credits: { used: credits, limit: pro ? limits.proMonthlyCredits : limits.monthlyCredits },
    packCredits: billing.packCredits,
    requestsToday: { used: requests, limit: pro ? limits.proDailyRequests : limits.dailyRequests },
    unlimited,
    // 無料の人全体の上限で止めるのは、払っていない人(Pro でも追加クレジットを持つのでもない人)だけ
    freePoolExhausted:
      !unlimited && !pro && billing.packCredits <= 0 && isFreePoolExhausted(poolCost, limits.freeMonthlyBudgetYen),
    monthResetsAt: periods.monthResetsAt,
    dayResetsAt: periods.dayResetsAt,
  };
}

/** 依頼の原価を、無料の人全体の合計に数えるか(払っていない人の依頼だけ数える) */
export function countsTowardFreePool(status: Pick<AiUsageStatus, "unlimited" | "plan" | "packCredits">): boolean {
  return !status.unlimited && status.plan === "free" && status.packCredits <= 0;
}

/** 月と日の行に数を足す(行が無ければ作る)。何度呼んでも足した分だけ増える */
async function addTo(
  userId: string,
  period: string,
  ttlSeconds: number,
  now: Date,
  amounts: Partial<Record<"requests" | "credits" | "costMicroUsd", number>>,
): Promise<Record<string, unknown> | undefined> {
  const entries = Object.entries(amounts).filter(([, value]) => value !== undefined && value > 0);
  if (entries.length === 0) return undefined;
  const { Attributes } = await db.send(
    new UpdateCommand({
      TableName: tableName(),
      Key: { slug: usageKey(userId, period) },
      UpdateExpression: `SET #kind = :kind, #userId = :userId, #period = :period, #expiresAt = if_not_exists(#expiresAt, :expiresAt) ADD ${entries
        .map(([field]) => `#${field} :${field}`)
        .join(", ")}`,
      ExpressionAttributeNames: {
        "#kind": "kind",
        "#userId": "userId",
        "#period": "period",
        "#expiresAt": "expiresAt",
        ...Object.fromEntries(entries.map(([field]) => [`#${field}`, field])),
      },
      ExpressionAttributeValues: {
        ":kind": KIND,
        ":userId": userId,
        ":period": period,
        ":expiresAt": Math.floor(now.getTime() / 1000) + ttlSeconds,
        ...Object.fromEntries(entries.map(([field, value]) => [`:${field}`, value])),
      },
      ReturnValues: "UPDATED_NEW",
    }),
  );
  return Attributes;
}

/** その人の月と日の行に足す。無料の人(free)なら、無料の人全体の月の行にも足す */
async function addToUsage(
  userId: string,
  now: Date,
  free: boolean,
  amounts: Partial<Record<"requests" | "credits" | "costMicroUsd", number>>,
): Promise<number | null> {
  const periods = usagePeriods(now);
  const [month] = await Promise.all([
    addTo(userId, periods.month, MONTH_TTL_SECONDS, now, amounts),
    addTo(userId, periods.day, DAY_TTL_SECONDS, now, amounts),
    free ? addTo(FREE_POOL, periods.month, MONTH_TTL_SECONDS, now, amounts) : null,
  ]);
  return typeof month?.credits === "number" ? month.credits : null;
}

/** 依頼を受けたとき(1 日の回数の上限に使う) */
export async function recordAiRequest(userId: string, now: Date, free: boolean): Promise<void> {
  await addToUsage(userId, now, free, { requests: 1 });
}

/**
 * 答えが返ったとき。原価は小数を避けて 100 万分の 1 ドル単位で持つ。
 * 無料の人全体の上限は、依頼の前に読んだ合計で判断するので、同時に頼まれると少し超えることがある。
 * 今月の枠を超えた分は追加クレジットから引く(運営は引かない)。引いた量を返す
 */
export async function recordAiCost(
  userId: string,
  now: Date,
  status: Pick<AiUsageStatus, "credits" | "unlimited" | "plan" | "packCredits">,
  cost: { credits: number; costUsd: number },
): Promise<{ fromPacks: number }> {
  const free = countsTowardFreePool(status);
  const usedAfter = await addToUsage(userId, now, free, {
    credits: cost.credits,
    costMicroUsd: Math.round(cost.costUsd * 1_000_000),
  });
  if (status.unlimited || usedAfter === null) return { fromPacks: 0 };
  // 月の合計は ADD で足した直後の値なので、同時に別の依頼が記録されても、枠を超えた分を二重には数えない
  const overflow = overflowCredits(usedAfter - cost.credits, usedAfter, status.credits.limit);
  if (overflow <= 0) return { fromPacks: 0 };
  const unpaid = await deductPackCredits(userId, overflow, now);
  if (unpaid > 0) console.log(JSON.stringify({ msg: "ai-credits-unpaid", user: userId, credits: unpaid }));
  return { fromPacks: overflow - unpaid };
}
