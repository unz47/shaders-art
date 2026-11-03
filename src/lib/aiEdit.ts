// AI と作る(POST /api/ai/edit)の入出力。/edit の AI パネル(ブラウザ)、Route Handler(サーバー)、
// モック(MSW)で共有する。応答は Server-Sent Events で、返答文を少しずつ流してから最後に提案をまとめて送る。

import { findAiModel } from "./aiModels";

export const AI_PROMPT_MAX = 500;
/** 編集途中のコードは投稿の上限(4 KB)を超えていることもあるので、余裕を持たせる */
export const AI_SOURCE_MAX_BYTES = 16 * 1024;
/** 続けて頼むときに文脈として送る、直近のやりとりの数 */
export const AI_HISTORY_MAX = 6;
const AI_REPLY_MAX = 1000;

/** これまでのやりとり。コードは送らず、依頼と返答の文だけを文脈にする */
export interface AiTurnSummary {
  prompt: string;
  reply: string;
}

/** POST /api/ai/edit の本文 */
export interface AiEditRequest {
  /** 依頼の土台にするコード(未適用の提案があればその提案) */
  source: string;
  prompt: string;
  history?: AiTurnSummary[];
  /** 使うモデル(lib/aiModels の ID)。無ければサーバーの既定(環境変数 AI_MODEL) */
  model?: string;
}

/** 確かめ終わった依頼。model は選ばれていなければ null */
export type ValidAiEditRequest = Required<Omit<AiEditRequest, "model">> & { model: string | null };

/** 1 回の依頼で使ったトークンの数 */
export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
}

export type AiEditEvent =
  /** 返答文の断片。届いた順につなげて表示する */
  | { type: "text"; text: string }
  /**
   * 返答の完成形。text の断片とは別に送り直す(途中で別のモデルに切り替わると、断片には
   * 捨てられた出力も混ざるため)。source が null なら、コードの提案が無い返答(質問への回答など)
   */
  | {
      type: "done";
      reply: string;
      source: string | null;
      errors: string[];
      /** 答えたモデルと使ったトークンの数(わかれば) */
      model?: string;
      usage?: AiUsage;
    }
  | { type: "error"; message: string };

type Validated = { ok: true; value: ValidAiEditRequest } | { ok: false; errors: string[] };

export function validateAiEditRequest(input: unknown): Validated {
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: ["本文が JSON オブジェクトではありません"] };
  }
  const raw = input as Record<string, unknown>;
  const errors: string[] = [];

  const source = typeof raw.source === "string" ? raw.source : "";
  if (new TextEncoder().encode(source).length > AI_SOURCE_MAX_BYTES) {
    errors.push(`コードが長すぎます(${AI_SOURCE_MAX_BYTES / 1024} KB まで)`);
  }

  const prompt = typeof raw.prompt === "string" ? raw.prompt.trim() : "";
  if (!prompt) errors.push("依頼を入力してください");
  else if (prompt.length > AI_PROMPT_MAX) errors.push(`依頼は ${AI_PROMPT_MAX} 文字以内にしてください`);

  const history = (Array.isArray(raw.history) ? raw.history : [])
    .filter((t): t is AiTurnSummary => typeof t?.prompt === "string" && typeof t?.reply === "string")
    .slice(-AI_HISTORY_MAX)
    .map((t) => ({ prompt: t.prompt.slice(0, AI_PROMPT_MAX), reply: t.reply.slice(0, AI_REPLY_MAX) }));

  // 選べるのは lib/aiModels の一覧にあるモデルだけ(知らないモデルを呼ばせない)
  let model: string | null = null;
  if (raw.model !== undefined && raw.model !== null) {
    if (typeof raw.model === "string" && findAiModel(raw.model)) model = raw.model;
    else errors.push("選べないモデルです");
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { source, prompt, history, model } };
}

export function encodeSseEvent(event: AiEditEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

/** 受信済みの SSE テキストから完成したイベントを取り出し、読み残し(次のチャンクに続く分)を返す */
export function parseSseEvents(buffer: string): { events: AiEditEvent[]; rest: string } {
  const blocks = buffer.split("\n\n");
  const rest = blocks.pop() ?? "";
  const events: AiEditEvent[] = [];
  for (const block of blocks) {
    // ": ping" のようなコメント行(接続維持用)は data 行が無いので読み飛ばされる
    const data = block
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) continue;
    try {
      const event = JSON.parse(data) as AiEditEvent;
      if (event.type === "text" || event.type === "done" || event.type === "error") events.push(event);
    } catch {
      // 壊れたイベントは無視する(続きのイベントは読める)
    }
  }
  return { events, rest };
}

/** いま選べるモデルの ID。読めなければ null(呼ぶ側は Bedrock のモデルだけを出す) */
export async function getAvailableAiModels(): Promise<string[] | null> {
  try {
    const res = await fetch("/api/ai/models", { cache: "no-store" });
    if (!res.ok) return null;
    return ((await res.json()) as { models: string[] }).models;
  } catch {
    return null;
  }
}

export type AiEditResult =
  | { ok: true; reply: string; source: string | null; errors: string[]; model: string | null; usage: AiUsage | null }
  | { ok: false; status: number; message: string };

/**
 * AI に依頼する(要ログイン)。返答文は届くたびに onText に渡し、最後に提案をまとめて返す。
 * signal で途中で止められる(止めたときは AbortError が投げられる)。
 */
export async function requestAiEdit(
  input: AiEditRequest,
  { onText, signal }: { onText: (text: string) => void; signal?: AbortSignal },
): Promise<AiEditResult> {
  const res = await fetch("/api/ai/edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  if (!res.ok || !res.body) {
    const data = (await res.json().catch(() => ({}))) as { message?: string; errors?: string[] };
    const message = data.errors?.join("\n") || data.message || `AI を呼び出せませんでした (${res.status})`;
    return { ok: false, status: res.status, message };
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    const parsed = parseSseEvents(buffer + value);
    buffer = parsed.rest;
    for (const event of parsed.events) {
      if (event.type === "text") onText(event.text);
      else if (event.type === "done") {
        const { reply, source, errors, model, usage } = event;
        return { ok: true, reply, source, errors, model: model ?? null, usage: usage ?? null };
      }
      else return { ok: false, status: res.status, message: event.message };
    }
  }
  return { ok: false, status: res.status, message: "応答が途中で切れました。もう一度お試しください" };
}
