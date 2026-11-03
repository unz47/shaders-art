import type { AiUsage } from "./aiEdit";
import { AI_MODELS, findAiModel } from "./aiModels";

// AI の 1 人あたりの上限(issue #43)。サーバー(lib/server/aiUsage)とブラウザ(AI 欄の残りの表示)で共有する。
// クレジットは実際の原価で減らす(1 クレジット = 原価 ¥0.5 相当)。Qwen3 Coder ならおよそ 1 回 1、
// Claude Sonnet 4.6 なら 2〜14。回数で数えると、長く考えたときに原価が値段を超えてしまうため。
// 原価はドル建て(lib/aiModels の price)なので 1 ドル = 150 円で換算する。為替が大きく動いたら見直す。
// 上限は日本時間の月初・0 時に戻る(今日の 1 点と同じく日本時間で区切る)。

export const JPY_PER_USD = 150;
export const YEN_PER_CREDIT = 0.5;
/** 既定の上限(環境変数 AI_MONTHLY_CREDITS / AI_DAILY_REQUESTS で変えられる)。月 40 は #42 の無料枠と同じ */
export const DEFAULT_MONTHLY_CREDITS = 40;
export const DEFAULT_DAILY_REQUESTS = 20;

/** 一覧に無いモデル(環境変数 AI_MODEL で直接指定したものなど)は、一覧でいちばん高いモデルの値段で数える */
const MOST_EXPENSIVE = AI_MODELS.reduce(
  (max, model) => (model.price.output > max.output ? model.price : max),
  { input: 0, output: 0 },
);

/** 1 回の依頼の原価(ドル) */
export function aiCostUsd(model: string, tokens: AiUsage): number {
  const price = findAiModel(model)?.price ?? MOST_EXPENSIVE;
  return (tokens.inputTokens * price.input + tokens.outputTokens * price.output) / 1_000_000;
}

/** 原価をクレジットに直す。答えが返った依頼は、どんなに安くても 1 クレジットは数える */
export function creditsForCost(costUsd: number): number {
  return Math.max(1, Math.ceil((costUsd * JPY_PER_USD) / YEN_PER_CREDIT));
}

export interface UsagePeriods {
  /** 日本時間の年月(例: 2026-11) */
  month: string;
  /** 日本時間の年月日(例: 2026-11-01) */
  day: string;
  /** 月の上限が戻る時刻(日本時間の翌月 1 日 0 時、ISO) */
  monthResetsAt: string;
  /** 日の上限が戻る時刻(日本時間の翌日 0 時、ISO) */
  dayResetsAt: string;
}

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");

export function usagePeriods(now: Date): UsagePeriods {
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth();
  const d = jst.getUTCDate();
  return {
    month: `${y}-${pad(m + 1)}`,
    day: `${y}-${pad(m + 1)}-${pad(d)}`,
    monthResetsAt: new Date(Date.UTC(y, m + 1, 1) - JST_OFFSET_MS).toISOString(),
    dayResetsAt: new Date(Date.UTC(y, m, d + 1) - JST_OFFSET_MS).toISOString(),
  };
}

/** GET /api/ai/usage の応答。AI 欄が残りを出すのに使う */
export interface AiUsageStatus {
  credits: { used: number; limit: number };
  requestsToday: { used: number; limit: number };
  /** 運営など、上限なしで使える人(使用量は記録する) */
  unlimited: boolean;
  monthResetsAt: string;
  dayResetsAt: string;
}

/** 上限に達していれば、どちらの上限か。達していなければ null */
export function quotaBlock(status: AiUsageStatus): "monthly" | "daily" | null {
  if (status.unlimited) return null;
  if (status.credits.used >= status.credits.limit) return "monthly";
  if (status.requestsToday.used >= status.requestsToday.limit) return "daily";
  return null;
}
