import AnthropicAws from "@anthropic-ai/aws-sdk";
import { AnthropicBedrock, AnthropicBedrockMantle } from "@anthropic-ai/bedrock-sdk";
import { BedrockRuntimeClient, ConverseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import { betaRefusalFallbackMiddleware, BetaFallbackState, type Anthropic } from "@anthropic-ai/sdk";
import type { AiEditEvent, AiUsage, ValidAiEditRequest } from "../aiEdit";
import { AI_MODELS, type AiModel, findAiModel } from "../aiModels";
import type { Dictionary } from "../i18n";
import { SIZE_BUDGET_BYTES, sourceErrors } from "../submission";

// AI と作る の推論は Amazon Bedrock で行う。認証は Lambda の実行ロール(SigV4)なので API キーは持たない。
// リージョンは AWS_REGION。モデルによって呼び方が違う:
//   - Claude(lib/aiModels の via: "claude")… Claude Platform on AWS の Messages API。Anthropic が運営し、
//     請求は AWS。Lambda の実行ロール(SigV4)で呼ぶ。コードは propose_shader ツールの入力で受け取る
//   - Claude(via: "bedrock-claude")… Bedrock の InvokeModel(bedrock-runtime)に Messages API の形で送る。
//     同じくツールで受け取る(Bedrock は構造化出力に対応していないため)
//   - Claude(anthropic.* の ID)… Bedrock の Messages API(bedrock-mantle)。同じくツールで受け取る
//   - それ以外(Qwen など)… Bedrock の Converse API(bedrock-runtime)。ツールの対応がモデルごとに違うので、
//     コードは返答中の ```glsl ブロックで受け取る
// このアカウントでは bedrock-mantle の Claude がどれも 403 で、InvokeModel でも使えるのは Sonnet 4.6 と Haiku 4.5 だけ。
// 5 系の Claude は Claude Platform on AWS で呼ぶ。

export interface AiConfig {
  /** Bedrock のモデル ID(例: qwen.qwen3-coder-480b-a35b-v1:0、anthropic.claude-opus-4-8) */
  model: string;
  /** Claude が安全性の判定で断ったときに切り替えるモデル(Bedrock の Claude だけ)。未設定なら切り替えない */
  fallbackModel: string | null;
  /** Claude Platform on AWS のワークスペース ID(wrkspc_…)。未設定なら Claude は選べない */
  claudeWorkspaceId: string | null;
}

/** 環境変数はリクエストのたびに読む(理由は oauth.ts の getAuthConfig と同じ)。未設定なら null */
export function getAiConfig(env: Record<string, string | undefined> = process.env): AiConfig | null {
  const model = env.AI_MODEL;
  if (!model) return null;
  return {
    model,
    fallbackModel: env.AI_FALLBACK_MODEL || null,
    claudeWorkspaceId: env.ANTHROPIC_AWS_WORKSPACE_ID || null,
  };
}

/** 利用者が選べるモデル。Claude Platform on AWS のモデルは、ワークスペースが設定されているときだけ */
export function availableModels(cfg: AiConfig): AiModel[] {
  return AI_MODELS.filter((model) => model.via !== "claude" || cfg.claudeWorkspaceId !== null);
}

/** Messages API(propose_shader ツール)で呼ぶモデルか */
function usesMessagesApi(model: string): boolean {
  const via = findAiModel(model)?.via;
  return isClaudeModel(model) || via === "claude" || via === "bedrock-claude";
}

export function isClaudeModel(model: string): boolean {
  return model.startsWith("anthropic.");
}

/** Messages API で送る考え方の指定。Haiku 4.5 は adaptive thinking も effort も受け付けない(400 になる)ので送らない */
export function thinkingParams(model: string) {
  if (model.includes("claude-haiku-4-5")) return {};
  return {
    // Opus 4.8 は指定しないと考えずに答えるので、明示する(5 系では指定しなくても同じ)
    thinking: { type: "adaptive" },
    // 待たせすぎないよう、考える量はほどほどにする(Sonnet 5.5 は指定しないと high)。
    // Sonnet 4.6 は medium だと考えすぎることがある(16000 トークン考えて、答える前に切れた)ので low にする
    output_config: { effort: model.includes("claude-sonnet-4-6") ? "low" : "medium" },
  } as const;
}

// AI への指示は英語で書く。日本語で書くと、英語の依頼にも日本語で答えてしまった(Sonnet 4.6・Haiku 4.5・Qwen3 Coder、
// 2026-10-29)。説明文は依頼と同じ言語で書かせ、依頼の言語が分からないとき(コードだけを貼ったときなど)は画面の言語にする
const RULES = `You are the shader editing assistant for shaders.art. The user writes GLSL works in an in-browser editor, and you rewrite their code as requested.

# Rules for works
- A work is a GLSL snippet that defines vec4 render(vec2 uv, vec2 p). Do not write a main function or any precision, uniform, or varying declarations (the runtime provides them). Helper functions and constants can go before render.
- uv is in 0–1. p has its origin at the center, runs from -1 to 1 vertically, and stretches horizontally with the aspect ratio.
- Available uniforms: float time (seconds), vec2 resolution (pixels), float attention (0–1; closer to 1 the more the work is being watched), vec2 mouse (the cursor position in the same coordinates as p).
- gl_FragCoord is not available.
- Keep the code within ${SIZE_BUDGET_BYTES} bytes. Bound every for loop with a numeric literal of at most 64 iterations, and do not use while.
- Keep it light enough to draw a frame within 8 ms.`;

const commonReplyRules = (t: Dictionary) => `- Write your explanation in the same language as the request under "# Request". If you can't tell its language, write in ${t.ai.replyLanguage}.
- Keep the code, comments, and style outside the requested part as they are, as much as possible.
- If the request conflicts with the rules, propose the closest thing within the rules and say so.`;

/** Claude 用(コードはツールで受け取る) */
export const systemPrompt = (t: Dictionary) => `${RULES}

# How to reply
- For a request that changes the code, write one or two sentences on what you changed and how, then pass the full edited code to the propose_shader tool. Pass the full code, not a diff.
- When the code doesn't need to change (questions, explanations), answer briefly without using the tool.
${commonReplyRules(t)}`;

/** Claude 以外用(コードは返答中のコードブロックで受け取る) */
export const systemPromptCodeBlock = (t: Dictionary) => `${RULES}

# How to reply
- For a request that changes the code, write one or two sentences on what you changed and how, then show the full edited code in a single \`\`\`glsl code block. Show the full code, not a diff, and write nothing after the code block.
- When the code doesn't need to change (questions, explanations), answer briefly without a code block.
${commonReplyRules(t)}`;

export const PROPOSE_SHADER_TOOL = {
  name: "propose_shader",
  description: "Propose the full edited code of the work. The user reviews the diff before applying it.",
  input_schema: {
    type: "object",
    properties: {
      source: { type: "string", description: "The full edited code, including vec4 render(vec2 uv, vec2 p)" },
    },
    required: ["source"],
  },
} satisfies Anthropic.Beta.BetaTool;

// 見出しは英語にしておく(日本語だと、英語の依頼にも日本語で答えやすくなる。説明文の言語は依頼に合わせる)
export function buildUserMessage({ source, prompt, history }: Pick<ValidAiEditRequest, "source" | "prompt" | "history">): string {
  const parts: string[] = [];
  if (history.length > 0) {
    parts.push(
      "# Conversation so far (oldest first)",
      history.map((t) => `- Request: ${t.prompt}\n  Reply: ${t.reply}`).join("\n"),
    );
  }
  parts.push("# Current code", "```glsl", source || "(empty)", "```", "# Request", prompt);
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

/**
 * 依頼を 1 回投げる。返答文は届くたびに onText に渡す。止めたいときは signal を abort する。
 * t は依頼の言語の文言(エラーと静的チェックの文、AI の説明文の言語の目安に使う)
 */
export function runAiEdit(
  cfg: AiConfig,
  request: ValidAiEditRequest,
  { onText, signal, t }: { onText: (text: string) => void; signal: AbortSignal; t: Dictionary },
): Promise<AiEditOutcome> {
  return usesMessagesApi(cfg.model)
    ? runClaude(cfg, request, onText, signal, t)
    : runConverse(cfg, request, onText, signal, t);
}

// ---- Claude(Messages API。Claude Platform on AWS か、Bedrock の InvokeModel か bedrock-mantle)----

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

// Claude Platform on AWS。リージョンは AWS_REGION(ワークスペースは同じリージョンに作っておく)
let cachedPlatform: { workspaceId: string; client: AnthropicAws } | undefined;

function platformClient(workspaceId: string): AnthropicAws {
  if (cachedPlatform?.workspaceId !== workspaceId) {
    cachedPlatform = { workspaceId, client: new AnthropicAws({ workspaceId }) };
  }
  return cachedPlatform.client;
}

// Bedrock の InvokeModel。リージョンは AWS_REGION
let cachedInvoke: AnthropicBedrock | undefined;

async function runClaude(
  cfg: AiConfig,
  request: ValidAiEditRequest,
  onText: (text: string) => void,
  signal: AbortSignal,
  t: Dictionary,
): Promise<AiEditOutcome> {
  const params = {
    model: cfg.model,
    max_tokens: MAX_TOKENS,
    ...thinkingParams(cfg.model),
    system: systemPrompt(t),
    tools: [PROPOSE_SHADER_TOOL],
    messages: [{ role: "user", content: buildUserMessage(request) }],
  } satisfies Anthropic.Beta.MessageCreateParamsNonStreaming;
  const via = findAiModel(cfg.model)?.via;
  const stream = messagesStream(cfg, via, params, signal);
  stream.on("text", onText);
  const message = await stream.finalMessage();
  // InvokeModel の応答の model は推論プロファイルの接頭辞(jp.)が外れた ID なので、選ばれた ID で返す
  const model = via === "bedrock-claude" ? cfg.model : message.model;
  const usage = { inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens };
  return {
    event: withUsage(toFinalEvent(message, t), model, usage),
    model,
    stopReason: message.stop_reason,
    usage: message.usage,
  };
}

function messagesStream(
  cfg: AiConfig,
  via: AiModel["via"] | undefined,
  params: Anthropic.Beta.MessageCreateParamsNonStreaming,
  signal: AbortSignal,
) {
  if (via === "claude") {
    if (!cfg.claudeWorkspaceId) throw new Error("Claude Platform on AWS のワークスペースが設定されていません");
    return platformClient(cfg.claudeWorkspaceId).beta.messages.stream(params, { signal });
  }
  if (via === "bedrock-claude") {
    cachedInvoke ??= new AnthropicBedrock();
    return cachedInvoke.beta.messages.stream(params, { signal });
  }
  // 断られたときの切り替え先はこの 1 回の依頼の中でだけ覚えておく
  return mantleClient(cfg).beta.messages.stream(params, { fallbackState: new BetaFallbackState(), signal });
}

/** Claude の完成した応答を、ブラウザに送る done(または error)イベントにする */
export function toFinalEvent(message: Anthropic.Beta.BetaMessage, t: Dictionary): AiEditEvent {
  if (message.stop_reason === "refusal") return { type: "error", message: t.ai.refused };
  if (message.stop_reason === "max_tokens") return { type: "error", message: t.ai.truncated };
  // 断られて別のモデルに切り替わった場合は、切り替え(fallback ブロック)より前の出力を使わない
  const blocks = message.content.slice(message.content.findLastIndex((b) => b.type === "fallback") + 1);
  const reply = blocks
    .flatMap((b) => (b.type === "text" ? [b.text] : []))
    .join("")
    .trim();
  const tool = blocks.findLast((b) => b.type === "tool_use" && b.name === PROPOSE_SHADER_TOOL.name);
  const input = tool?.type === "tool_use" ? (tool.input as { source?: unknown }) : undefined;
  const source = typeof input?.source === "string" ? input.source : null;
  return doneEvent(reply, source, t);
}

// ---- Claude 以外(bedrock-runtime の Converse API)----

let cachedRuntime: BedrockRuntimeClient | undefined;

async function runConverse(
  cfg: AiConfig,
  request: ValidAiEditRequest,
  onText: (text: string) => void,
  signal: AbortSignal,
  t: Dictionary,
): Promise<AiEditOutcome> {
  cachedRuntime ??= new BedrockRuntimeClient({});
  const response = await cachedRuntime.send(
    new ConverseStreamCommand({
      modelId: cfg.model,
      system: [{ text: systemPromptCodeBlock(t) }],
      messages: [{ role: "user", content: [{ text: buildUserMessage(request) }] }],
      inferenceConfig: { maxTokens: MAX_TOKENS },
    }),
    { abortSignal: signal },
  );

  let text = "";
  let sent = 0;
  let stopReason: string | null = null;
  let usage: { inputTokens?: number; outputTokens?: number } | null = null;
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
    if (event.metadata) usage = event.metadata.usage ?? null;
  }

  if (stopReason === "max_tokens") {
    return { event: { type: "error", message: t.ai.truncated }, model: cfg.model, stopReason, usage };
  }
  if (stopReason === "content_filtered" || stopReason === "guardrail_intervened") {
    const event: AiEditEvent = { type: "error", message: t.ai.refused };
    return { event, model: cfg.model, stopReason, usage };
  }
  const { reply, source } = parseCodeBlockReply(text);
  const tokens = usage && { inputTokens: usage.inputTokens ?? 0, outputTokens: usage.outputTokens ?? 0 };
  return { event: withUsage(doneEvent(reply, source, t), cfg.model, tokens), model: cfg.model, stopReason, usage };
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

/** done イベントに、答えたモデルと使ったトークンの数を添える(パネルでやりとりごとに出す) */
function withUsage(event: AiEditEvent, model: string, usage: AiUsage | null): AiEditEvent {
  if (event.type !== "done") return event;
  return usage ? { ...event, model, usage } : { ...event, model };
}

function doneEvent(reply: string, source: string | null, t: Dictionary): AiEditEvent {
  return { type: "done", reply, source, errors: source === null ? [] : sourceErrors(source, t.submission) };
}
