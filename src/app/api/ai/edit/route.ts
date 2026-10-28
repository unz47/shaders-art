import { APIError, RateLimitError } from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { encodeSseEvent, validateAiEditRequest, type AiEditEvent } from "@/lib/aiEdit";
import type { Dictionary } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n/server";
import { availableModels, getAiConfig, runAiEdit } from "@/lib/server/ai";
import { getSession, isSameOriginRequest } from "@/lib/server/session";

// POST /api/ai/edit(要ログイン)→ text/event-stream
//   event: text  … 返答文の断片
//   event: done  … 返答全文と、提案されたコード全文(と静的チェックの結果)
//   event: error … 途中で失敗した
// 返答を少しずつ返すため、Lambda の応答はストリーミングにしてある(infra/lib/nextjs-site.ts)。
// CloudFront はオリジンから 30 秒何も届かないと接続を切るが、モデルが考えている間は文字が
// 出てこないので、そのあいだも ping を送り続ける。
// クレジット(利用者課金)はまだ無い。呼び出しの量は usage をログに出して見ておく。

const KEEPALIVE_MS = 10_000;

/** 混み合っているときに Bedrock(AWS SDK)が返すエラー */
const BUSY_ERRORS = new Set(["ThrottlingException", "ServiceUnavailableException", "ModelNotReadyException"]);

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ message: "forbidden" }, { status: 403 });
  // 文言は依頼の言語で返す(Cookie → Accept-Language → 英語)
  const t = await getDictionary();
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ message: t.api.jsonOnly }, { status: 415 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ message: t.ai.loginNeeded }, { status: 401 });

  const cfg = getAiConfig();
  if (!cfg) return NextResponse.json({ message: t.ai.notConfigured }, { status: 503 });

  const parsed = validateAiEditRequest(await request.json().catch(() => null), t);
  if (!parsed.ok) return NextResponse.json({ message: t.ai.badRequest, errors: parsed.errors }, { status: 400 });
  // 一覧にあっても、設定が済んでいないモデル(Claude Platform on AWS のワークスペースが無い Claude)は使えない
  const chosen = parsed.value.model;
  if (chosen !== null && !availableModels(cfg).some((m) => m.id === chosen)) {
    return NextResponse.json({ message: t.ai.modelUnavailable }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const abort = new AbortController();
  request.signal.addEventListener("abort", () => abort.abort());
  let closed = false;

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (chunk: string) => {
        if (!closed) controller.enqueue(encoder.encode(chunk));
      };
      const send = (event: AiEditEvent) => write(encodeSseEvent(event));
      const ping = setInterval(() => write(": ping\n\n"), KEEPALIVE_MS);

      try {
        // 選ばれたモデル(lib/aiModels で確かめ済み)。選ばれていなければ既定(AI_MODEL)
        const model = parsed.value.model ?? cfg.model;
        const outcome = await runAiEdit({ ...cfg, model }, parsed.value, {
          t,
          onText: (text) => send({ type: "text", text }),
          signal: abort.signal,
        });
        send(outcome.event);
        console.log(
          JSON.stringify({ msg: "ai-edit", model: outcome.model, stop: outcome.stopReason, usage: outcome.usage }),
        );
      } catch (error) {
        // ブラウザが止めた(接続を切った)ときは、返す相手がいないので何もしない
        if (!abort.signal.aborted) {
          console.error("[ai/edit] failed", error);
          send({ type: "error", message: errorMessage(error, t) });
        }
      } finally {
        clearInterval(ping);
        if (!closed) {
          closed = true;
          controller.close();
        }
      }
    },
    cancel() {
      // ブラウザが接続を切った(停止ボタンなど)
      closed = true;
      abort.abort();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}

function errorMessage(error: unknown, t: Dictionary): string {
  const busy = error instanceof RateLimitError || (error instanceof Error && BUSY_ERRORS.has(error.name));
  if (busy) return t.ai.busy;
  if (error instanceof APIError) return t.ai.apiFailed;
  return t.ai.unexpected;
}
