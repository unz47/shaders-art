// 作品の通報と非公開(運営・通報による)の決まりごと。ブラウザとサーバーの両方から使うので、
// ここには DB を触らない純粋な関数だけを置く(DB は lib/server/moderation)。

/** 通報の理由。並びは通報の画面に出す順 */
export const REPORT_REASONS = ["spam", "rights", "offensive", "heavy", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** 通報に添える説明の上限(文字数) */
export const REPORT_NOTE_MAX = 500;

/** 作品を非公開にしたのは誰か。operator = 運営が手で、reports = 通報がしきい値に達して自動で */
export type HiddenBy = "operator" | "reports";

export interface ReportInput {
  reason: ReportReason;
  note: string;
}

/** 運営の画面に出す、通報があるか非公開にされている作品 */
export interface ReportedWork {
  slug: string;
  title: string;
  author: string;
  createdAt: string;
  visibility?: string;
  hiddenBy?: string;
  hiddenAt?: string;
  reportCount: number;
  /** 新しい順。通報した人の ID は運営にも出さない(理由と説明だけで判断する) */
  reports: { reason: ReportReason; note: string; createdAt: string }[];
}

export function validateReport(raw: unknown): ReportInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { reason, note } = raw as Record<string, unknown>;
  if (typeof reason !== "string" || !(REPORT_REASONS as readonly string[]).includes(reason)) return null;
  if (note !== undefined && typeof note !== "string") return null;
  const trimmed = (note ?? "").trim();
  if (trimmed.length > REPORT_NOTE_MAX) return null;
  return { reason: reason as ReportReason, note: trimmed };
}

/**
 * ほかの人に見せてよい作品か。visibility が無い既存作品は公開扱い。
 * 運営か通報で非公開になった作品(hiddenBy あり)は、作者が公開にしていても見せない。
 */
export function isPublicWork(work: { visibility?: string; hiddenBy?: string }): boolean {
  return (work.visibility === undefined || work.visibility === "public") && work.hiddenBy === undefined;
}

/** 別々の人からの通報がこの数に達したら、運営が見るまで自動で非公開にする。既定は 3 */
export function autoHideThreshold(env: Record<string, string | undefined> = process.env): number {
  const n = Number(env.REPORT_AUTO_HIDE_THRESHOLD);
  return Number.isInteger(n) && n >= 1 ? n : 3;
}

/**
 * 運営か。ADMIN_EMAILS(カンマ区切り)に入っていて、そのメールアドレスが確認済みのときだけ。
 * 確認済みを見るのは、Cognito ではメールアドレスを未確認のまま別のものに変えられ、
 * そのあいだ ID トークンに新しい(未確認の)アドレスが入るため。
 */
export function isAdmin(
  session: { email: string | null; emailVerified: boolean } | null,
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (!session?.email || !session.emailVerified) return false;
  return parseEmailList(env.ADMIN_EMAILS).includes(session.email.toLowerCase());
}

/** カンマ区切りのメールアドレスを、空を除いて小文字にそろえる */
export function parseEmailList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
