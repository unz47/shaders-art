import { createHash, randomBytes } from "node:crypto";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { usagePeriods } from "../aiQuota";
import { db, tableName } from "./db";

// アクセス解析(issue #43)。ブラウザ(src/instrumentation-client.ts)が、ページを開いた・移ったときに
// パスと参照元のドメインだけを POST /api/pv に送り、ここで整えて CloudWatch Logs に 1 行("pv")出す。
// 集計は Logs Insights で行う(README)。Cookie も端末に残す ID も使わない。
// 同じ人の数え方: その月だけの秘密の値 + IP アドレス + User-Agent のハッシュ(visitor)。IP アドレスそのものは
// どこにも残さない。秘密の値は作品と同じ表に月ごとに作り、月が変わったら TTL で消すので、
// あとから IP アドレスとハッシュを結び付けたり、月をまたいで同じ人をたどったりはできない。

const SALT_KIND = "pv-salt";
const MAX_BODY_LENGTH = 2048;
const MAX_PATH_LENGTH = 300;

export interface PageView {
  /** ページのパス(? と # の後ろは持たない) */
  path: string;
  /** よそのサイトから来たときの、そのサイトのドメイン。サイトの中の移動や直接開いたときは null */
  ref: string | null;
}

// ログインの行き帰り(Cognito のログイン画面)は参照元として数えない
const IGNORED_REF = /(^|\.)amazoncognito\.com$/;

/** ブラウザから届いた本文を読む。形が違えば null(記録しない) */
export function parsePageView(body: string): PageView | null {
  if (body.length > MAX_BODY_LENGTH) return null;
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const { path, ref } = data as Record<string, unknown>;
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) return null;
  // 末尾の / はそろえる(作品へのリンクは /s/{slug}/ で、開くと /s/{slug} になる)
  const clean = path.replace(/[?#].*$/s, "").slice(0, MAX_PATH_LENGTH).replace(/(.)\/+$/, "$1");
  if (clean.startsWith("/api/") || clean.startsWith("/_next/")) return null;
  return { path: clean, ref: refHost(ref) };
}

function refHost(ref: unknown): string | null {
  if (typeof ref !== "string" || ref.length > 253) return null;
  const host = ref.toLowerCase();
  if (!/^[a-z0-9.-]+(:\d+)?$/.test(host) || IGNORED_REF.test(host)) return null;
  return host;
}

/** 検索エンジンや表示確認のツールなど、人でないアクセス(JavaScript を動かすものだけが届く) */
export function isBot(userAgent: string): boolean {
  return userAgent === "" || /bot|crawl|spider|slurp|headless|lighthouse/i.test(userAgent);
}

/** 利用者の IP アドレス。CloudFront が X-Forwarded-For の先頭に入れる */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
}

/** 同じ月・同じ IP アドレス・同じブラウザなら同じ値になる。16 桁で十分に区別できる */
export function visitorId(salt: string, ip: string, userAgent: string): string {
  return createHash("sha256").update(`${salt}\n${ip}\n${userAgent}`).digest("hex").slice(0, 16);
}

// 秘密の値は Lambda のインスタンスごとに覚えておき、月が変わったら読み直す
let cachedSalt: { month: string; salt: string } | null = null;

async function readSalt(key: string): Promise<string | null> {
  const { Item } = await db.send(
    new GetCommand({ TableName: tableName(), Key: { slug: key }, ConsistentRead: true }),
  );
  return typeof Item?.salt === "string" ? Item.salt : null;
}

/** その月の秘密の値。無ければ作る(同時に作ろうとしたら、先に作られた方を使う) */
export async function monthlySalt(now: Date): Promise<string> {
  const { month, monthResetsAt } = usagePeriods(now);
  if (cachedSalt?.month === month) return cachedSalt.salt;
  const key = `${SALT_KIND}#${month}`;
  let salt = await readSalt(key);
  if (salt === null) {
    salt = randomBytes(32).toString("hex");
    try {
      await db.send(
        new PutCommand({
          TableName: tableName(),
          Item: {
            slug: key,
            kind: SALT_KIND,
            salt,
            // 月が終わったら消す(TTL は期限から数日以内に消える)
            expiresAt: Math.floor(Date.parse(monthResetsAt) / 1000),
          },
          ConditionExpression: "attribute_not_exists(slug)",
        }),
      );
    } catch (error) {
      if (!(error instanceof ConditionalCheckFailedException)) throw error;
      salt = await readSalt(key);
      if (salt === null) throw error;
    }
  }
  cachedSalt = { month, salt };
  return salt;
}
