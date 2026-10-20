import { AnthropicBedrockMantle } from "@anthropic-ai/bedrock-sdk";
import { BedrockRuntimeClient, ConverseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import { betaRefusalFallbackMiddleware, BetaFallbackState, type Anthropic } from "@anthropic-ai/sdk";
import type { AiEditEvent, AiEditRequest } from "../aiEdit";
import { sourceErrors } from "../submission";

// AI と作る の推論は Amazon Bedrock で行う。認証は Lambda の実行ロール(SigV4)なので API キーは持たない。
// リージョンは AWS_REGION。モデルによって呼び方が違う:
//   - Claude(anthropic.*)… Messages API(bedrock-mantle)。コードは propose_shader ツールの入力で受け取る
//     (Bedrock は構造化出力に対応していないため)
//   - それ以外(Qwen など)… Converse API(bedrock-runtime)。ツールの対応がモデルごとに違うので、
//     コードは返答中の ```glsl ブロックで受け取る
// このアカウントでは Bedrock の Claude が使えない制限があるため、いまは Qwen3 Coder で動かしている。

export interface AiConfig {
  /** Bedrock のモデル ID(例: qwen.qwen3-coder-480b-a35b-v1:0、anthropic.claude-opus-4-8) */
  model: string;
  /** Claude が安全性の判定で断ったときに切り替えるモデル。未設定なら切り替えない */
  fallbackModel: string | null;
}

/** 環境変数はリクエストのたびに読む(理由は oauth.ts の getAuthConfig と同じ)。未設定なら null */
export function getAiConfig(env: Record<string, string | undefined> = process.env): AiConfig | null {
  const model = env.AI_MODEL;
  if (!model) return null;
  return { model, fallbackModel: env.AI_FALLBACK_MODEL || null };
}

export function isClaudeModel(model: string): boolean {
  return model.startsWith("anthropic.");
}

const RULES = `あなたは shaders.art のシェーダー編集アシスタントです。利用者はブラウザのエディタで GLSL の作品を書いていて、あなたは依頼に応じてそのコードを書き換えます。

# 作品の規約
- 作品は vec4 render(vec2 uv, vec2 p) を定義する GLSL のコード片です。main 関数・precision・uniform・varying の宣言は書きません(実行環境が用意します)。補助関数や定数は render より前に書けます。
- uv は 0〜1 の座標です。p は中心が原点で、縦が -1〜1、横はアスペクト比に合わせて伸びた座標です。
- 使える uniform: float time(秒)、vec2 resolution(ピクセル)、float attention(0〜1。作品が見られているほど 1 に近づく)、vec2 mouse(p と同じ座標系のカーソル位置)。
- gl_FragCoord は使えません。
- コードは 4096 バイト以内。for ループの上限は数値リテラルで 64 回以下にし、while は使いません。
- 1 フレームを 8 ミリ秒以内で描ける重さにします。`;

const COMMON_REPLY_RULES = `- 依頼された部分以外のコード・コメント・書き方は、できるだけそのまま残します。
- 依頼が規約と両立しないときは、規約の範囲で近いものを提案し、その旨を書きます。`;

/** Claude 用(コードはツールで受け取る) */
export const SYSTEM_PROMPT = `${RULES}

# 返答のしかた
- コードを変える依頼には、何をどう変えたかを日本語で 1〜2 文書いてから、propose_shader ツールで編集後のコード全文を渡します。差分ではなく全文を渡してください。
- 質問や解説の依頼など、コードを変える必要がないときは、ツールを使わず日本語で簡潔に答えます。
${COMMON_REPLY_RULES}`;

/** Claude 以外用(コードは返答中のコードブロックで受け取る) */
export const SYSTEM_PROMPT_CODE_BLOCK = `${RULES}

# 返答のしかた
- コードを変える依頼には、何をどう変えたかを日本語で 1〜2 文書いてから、編集後のコード全文を \`\`\`glsl のコードブロック 1 つで示します。差分ではなく全文を示し、コードブロックの後には何も書きません。
- 質問や解説の依頼など、コードを変える必要がないときは、コードブロックを使わず日本語で簡潔に答えます。
${COMMON_REPLY_RULES}`;

export const PROPOSE_SHADER_TOOL = {
  name: "propose_shader",
  description: "編集後の作品のコード全文を提案する。利用者は差分を確かめてから適用する。",
  input_schema: {
    type: "object",
    properties: {
      source: { type: "string", description: "vec4 render(vec2 uv, vec2 p) を含む、編集後のコード全文" },
    },
    required: ["source"],
  },
} satisfies Anthropic.Beta.BetaTool;

export function buildUserMessage({ source, prompt, history }: Required<AiEditRequest>): string {
  const parts: string[] = [];
  if (history.length > 0) {
    parts.push(
      "# これまでのやりとり(古い順)",
      history.map((t) => `- 依頼: ${t.prompt}\n  返答: ${t.reply}`).join("\n"),
    );
  }
  parts.push("# 現在のコード", "```glsl", source || "(空)", "```", "# 依頼", prompt);
  return parts.join("\n\n");
}

const MAX_TOKENS = 16000;

export interface AiEditOutcome {
  /** ブラウザに最後に送る done(または error)イベント */
  event: AiEditEvent;
  /** ログ用 */
  model: string;
  stopReason: string | null;
  usage: unknown;
}

/** 依頼を 1 回投げる。返答文は届くたびに onText に渡す。止めたいときは signal を abort する */
export function runAiEdit(
  cfg: AiConfig,
  request: Required<AiEditRequest>,
  { onText, signal }: { onText: (text: string) => void; signal: AbortSignal },
): Promise<AiEditOutcome> {
  return isClaudeModel(cfg.model) ? runClaude(cfg, request, onText, signal) : runConverse(cfg, request, onText, signal);
}

// ---- Claude(bedrock-mantle の Messages API)----

// 認証情報の解決をやり直さないよう、Lambda のインスタンス内で使い回す
let cachedMantle: { fallbackModel: string | null; client: AnthropicBedrockMantle } | undefined;

function mantleClient(cfg: AiConfig): AnthropicBedrockMantle {
  if (cachedMantle?.fallbackModel !== cfg.fallbackModel) {
    // Bedrock にはサーバー側の切り替え(fallbacks)が無いので、SDK のミドルウェアで切り替える
    const middleware = cfg.fallbackModel ? [betaRefusalFallbackMiddleware([{ model: cfg.fallbackModel }])] : [];
    cachedMantle = { fallbackModel: cfg.fallbackModel, client: new AnthropicBedrockMantle({ middleware }) };
  }
  return cachedMantle.client;
}

async function runClaude(
  cfg: AiConfig,
  request: Required<AiEditRequest>,
  onText: (text: string) => void,
  signal: AbortSignal,
): Promise<AiEditOutcome> {
  const stream = mantleClient(cfg).beta.messages.stream(
    {
      model: cfg.model,
      max_tokens: MAX_TOKENS,
      // Opus 4.8 は指定しないと考えずに答えるので、明示する(5 系では指定しなくても同じ)
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: SYSTEM_PROMPT,
      tools: [PROPOSE_SHADER_TOOL],
      messages: [{ role: "user", content: buildUserMessage(request) }],
    },
    // 断られたときの切り替え先はこの 1 回の依頼の中でだけ覚えておく
    { fallbackState: new BetaFallbackState(), signal },
  );
  stream.on("text", onText);
  const message = await stream.finalMessage();
  return { event: toFinalEvent(message), model: message.model, stopReason: message.stop_reason, usage: message.usage };
}

/** Claude の完成した応答を、ブラウザに送る done(または error)イベントにする */
export function toFinalEvent(message: Anthropic.Beta.BetaMessage): AiEditEvent {
  if (message.stop_reason === "refusal") {
    return { type: "error", message: "この依頼には応えられませんでした。言い方を変えてお試しください" };
  }
  if (message.stop_reason === "max_tokens") return TRUNCATED;
  // 断られて別のモデルに切り替わった場合は、切り替え(fallback ブロック)より前の出力を使わない
  const blocks = message.content.slice(message.content.findLastIndex((b) => b.type === "fallback") + 1);
  const reply = blocks
    .flatMap((b) => (b.type === "text" ? [b.text] : []))
    .join("")
    .trim();
  const tool = blocks.findLast((b) => b.type === "tool_use" && b.name === PROPOSE_SHADER_TOOL.name);
  const input = tool?.type === "tool_use" ? (tool.input as { source?: unknown }) : undefined;
  const source = typeof input?.source === "string" ? input.source : null;
  return doneEvent(reply, source);
}

// ---- Claude 以外(bedrock-runtime の Converse API)----

let cachedRuntime: BedrockRuntimeClient | undefined;

async function runConverse(
  cfg: AiConfig,
  request: Required<AiEditRequest>,
  onText: (text: string) => void,
  signal: AbortSignal,
): Promise<AiEditOutcome> {
  cachedRuntime ??= new BedrockRuntimeClient({});
  const response = await cachedRuntime.send(
    new ConverseStreamCommand({
      modelId: cfg.model,
      system: [{ text: SYSTEM_PROMPT_CODE_BLOCK }],
      messages: [{ role: "user", content: [{ text: buildUserMessage(request) }] }],
      inferenceConfig: { maxTokens: MAX_TOKENS },
    }),
    { abortSignal: signal },
  );

  let text = "";
  let sent = 0;
  let stopReason: string | null = null;
  let usage: unknown = null;
  for await (const event of response.stream ?? []) {
    // 考えている途中(reasoningContent)は表示しない
    const delta = event.contentBlockDelta?.delta?.text;
    if (delta) {
      text += delta;
      // コードブロックが始まるまでの説明文だけを流す
      const visible = streamableReplyLength(text);
      if (visible > sent) {
        onText(text.slice(sent, visible));
        sent = visible;
      }
    }
    if (event.messageStop) stopReason = event.messageStop.stopReason ?? null;
    if (event.metadata) usage = event.metadata.usage;
  }

  if (stopReason === "max_tokens") return { event: TRUNCATED, model: cfg.model, stopReason, usage };
  if (stopReason === "content_filtered" || stopReason === "guardrail_intervened") {
    const event: AiEditEvent = { type: "error", message: "この依頼には応えられませんでした。言い方を変えてお試しください" };
    return { event, model: cfg.model, stopReason, usage };
  }
  const { reply, source } = parseCodeBlockReply(text);
  return { event: doneEvent(reply, source), model: cfg.model, stopReason, usage };
}

const FENCE = "```";

/**
 * 返答のうち、説明文としてもう表示してよい長さ。コードブロックが始まったらそこまで。
 * 末尾の ` は次の断片でコードブロックの始まりになるかもしれないので、まだ出さない。
 */
export function streamableReplyLength(text: string): number {
  const fence = text.indexOf(FENCE);
  if (fence !== -1) return fence;
  return text.length - (text.match(/`{1,2}$/)?.[0].length ?? 0);
}

/** 「説明文 + ```glsl コードブロック」の返答を分ける。コードブロックが無ければ提案なし */
export function parseCodeBlockReply(text: string): { reply: string; source: string | null } {
  const match = /```[a-zA-Z]*[^\S\n]*\n([\s\S]*?)\n?```/.exec(text);
  if (!match) return { reply: text.trim(), source: null };
  const before = text.slice(0, match.index).trim();
  const after = text.slice(match.index + match[0].length).trim();
  return { reply: [before, after].filter(Boolean).join("\n\n"), source: match[1] ?? "" };
}

const TRUNCATED: AiEditEvent = {
  type: "error",
  message: "返答が長くなりすぎて途中で切れました。依頼を小さく分けてお試しください",
};

function doneEvent(reply: string, source: string | null): AiEditEvent {
  return { type: "done", reply, source, errors: source === null ? [] : sourceErrors(source) };
}
