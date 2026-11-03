import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import {
  type AiUsageStatus,
  DEFAULT_DAILY_REQUESTS,
  DEFAULT_MONTHLY_CREDITS,
  JPY_PER_USD,
  usagePeriods,
} from "../aiQuota";
import { db, tableName } from "./db";
import type { Session } from "./session";

// AI の使用量(issue #43)。作品・お気に入りと同じ表に、ユーザーごと・月ごと・日ごとの行として入れる。
//   ai-usage#<ユーザー ID>#2026-11     … その月の依頼の回数・クレジット・原価
//   ai-usage#<ユーザー ID>#2026-11-01  … その日の依頼の回数・クレジット・原価
//   ai-usage#free#2026-11             … 無料の人全体の、その月の合計(運営など上限なしの人は含めない)
// 回数は依頼を受けた時点で、クレジットと原価は答えが返った(途中で切れた・断られたも含む)時点で足す。
// 利用者が途中で止めた依頼は、使ったトークンの数が届かないので、時間から見積もった分を数える(lib/server/ai)。
// 古い行は TTL(expiresAt。infra の WorksTable)で消す。原価は CloudWatch Logs の "ai-edit" でも見られる。

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
  const [credits, requests, poolCost] = await Promise.all([
    readCounter(usageKey(session.sub, periods.month), "credits"),
    readCounter(usageKey(session.sub, periods.day), "requests"),
    readCounter(usageKey(FREE_POOL, periods.month), "costMicroUsd"),
  ]);
  const unlimited = session.email !== null && limits.unlimitedEmails.includes(session.email.toLowerCase());
  return {
    credits: { used: credits, limit: limits.monthlyCredits },
    requestsToday: { used: requests, limit: limits.dailyRequests },
    unlimited,
    freePoolExhausted: !unlimited && isFreePoolExhausted(poolCost, limits.freeMonthlyBudgetYen),
    monthResetsAt: periods.monthResetsAt,
    dayResetsAt: periods.dayResetsAt,
  };
}

/** 月と日の行に数を足す(行が無ければ作る)。何度呼んでも足した分だけ増える */
async function addTo(
  userId: string,
  period: string,
  ttlSeconds: number,
  now: Date,
  amounts: Partial<Record<"requests" | "credits" | "costMicroUsd", number>>,
): Promise<void> {
  const entries = Object.entries(amounts).filter(([, value]) => value !== undefined && value > 0);
  if (entries.length === 0) return;
  await db.send(
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
    }),
  );
}

/** その人の月と日の行に足す。無料の人(free)なら、無料の人全体の月の行にも足す */
async function addToUsage(
  userId: string,
  now: Date,
  free: boolean,
  amounts: Partial<Record<"requests" | "credits" | "costMicroUsd", number>>,
): Promise<void> {
  const periods = usagePeriods(now);
  await Promise.all([
    addTo(userId, periods.month, MONTH_TTL_SECONDS, now, amounts),
    addTo(userId, periods.day, DAY_TTL_SECONDS, now, amounts),
    free ? addTo(FREE_POOL, periods.month, MONTH_TTL_SECONDS, now, amounts) : null,
  ]);
}

/** 依頼を受けたとき(1 日の回数の上限に使う) */
export function recordAiRequest(userId: string, now: Date, free: boolean): Promise<void> {
  return addToUsage(userId, now, free, { requests: 1 });
}

/**
 * 答えが返ったとき。原価は小数を避けて 100 万分の 1 ドル単位で持つ。
 * 無料の人全体の上限は、依頼の前に読んだ合計で判断するので、同時に頼まれると少し超えることがある
 */
export function recordAiCost(
  userId: string,
  now: Date,
  free: boolean,
  cost: { credits: number; costUsd: number },
): Promise<void> {
  return addToUsage(userId, now, free, { credits: cost.credits, costMicroUsd: Math.round(cost.costUsd * 1_000_000) });
}
