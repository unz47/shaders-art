import { CREDIT_PACK } from "./plans";

// 追加クレジットの残高の計算(issue #42)。AI はまず今月の枠(無料 40 / Pro 600)から使い、
// 枠を超えた分を追加クレジットから引く。追加クレジットは期限の早いものから使う。
// DynamoDB の読み書きは lib/server/billing。ここは計算だけ(テストしやすいように)。

export interface CreditPack {
  /** Checkout のセッション ID。同じ購入を 2 回足さないためのキー */
  id: string;
  /** 買った量 */
  credits: number;
  /** 使った量 */
  used: number;
  /** 買った時刻(ISO) */
  purchasedAt: string;
  /** 失効する時刻(ISO)。発行から 6 か月 */
  expiresAt: string;
}

/** 買った時刻から、失効する時刻を決める(発行から 6 か月。月末の日付は翌月に繰り越さず、その月の末日にする) */
export function packExpiry(purchasedAt: Date, months: number = CREDIT_PACK.validMonths): Date {
  const target = new Date(purchasedAt.getTime());
  const day = target.getUTCDate();
  target.setUTCDate(1);
  target.setUTCMonth(target.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

/** まだ使える(残りがあり、期限が来ていない)ものを、期限の早い順に */
export function usablePacks(packs: readonly CreditPack[], now: Date): CreditPack[] {
  return packs
    .filter((pack) => pack.used < pack.credits && new Date(pack.expiresAt).getTime() > now.getTime())
    .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt) || a.purchasedAt.localeCompare(b.purchasedAt));
}

/** 使える追加クレジットの合計 */
export function packBalance(packs: readonly CreditPack[], now: Date): number {
  return usablePacks(packs, now).reduce((sum, pack) => sum + (pack.credits - pack.used), 0);
}

/**
 * 今月の枠を超えた分。usedBefore / usedAfter はその月に使ったクレジットの合計(今回の依頼の前と後)。
 * 枠をまたいだ依頼は、超えた部分だけを数える
 */
export function overflowCredits(usedBefore: number, usedAfter: number, monthlyLimit: number): number {
  return Math.max(0, usedAfter - monthlyLimit) - Math.max(0, usedBefore - monthlyLimit);
}

/**
 * 追加クレジットから amount を引く(期限の早いものから)。足りなければ引けるだけ引き、引けなかった量を返す
 * (残高を超えた分は運営の負担になる。依頼の前に残高を確かめているので、1 回の依頼の超過分くらいで済む)
 */
export function consumePacks(
  packs: readonly CreditPack[],
  amount: number,
  now: Date,
): { packs: CreditPack[]; unpaid: number } {
  let remaining = Math.max(0, amount);
  const used = new Map<string, number>();
  for (const pack of usablePacks(packs, now)) {
    if (remaining === 0) break;
    const take = Math.min(remaining, pack.credits - pack.used);
    used.set(pack.id, pack.used + take);
    remaining -= take;
  }
  return {
    packs: packs.map((pack) => (used.has(pack.id) ? { ...pack, used: used.get(pack.id) ?? pack.used } : pack)),
    unpaid: remaining,
  };
}

/** 失効から 1 年たったものは記録から外す(行が大きくなりすぎないように)。返金や問い合わせに備えて 1 年は残す */
export function prunePacks(packs: readonly CreditPack[], now: Date): CreditPack[] {
  const yearMs = 365 * 24 * 60 * 60 * 1000;
  return packs.filter((pack) => new Date(pack.expiresAt).getTime() + yearMs > now.getTime());
}
