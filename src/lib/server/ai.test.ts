import type { Anthropic } from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { en } from "../i18n/en";
import { ja } from "../i18n/ja";
import {
  AiAbortedError,
  AiFirstResponseTimeoutError,
  availableModels,
  buildUserMessage,
  estimateAbortedTokens,
  getAiConfig,
  isClaudeModel,
  parseCodeBlockReply,
  streamableReplyLength,
  systemPrompt,
  systemPromptCodeBlock,
  thinkingParams,
  toFinalEvent,
  watchAiRequest,
} from "./ai";

const SOURCE = "vec4 render(vec2 uv, vec2 p) {\n  return vec4(uv, 0.5, 1.0);\n}";

// テストに要る項目だけを持つ応答
function message(
  content: unknown[],
  stopReason: Anthropic.Beta.BetaMessage["stop_reason"] = "tool_use",
): Anthropic.Beta.BetaMessage {
  return { content, stop_reason: stopReason } as unknown as Anthropic.Beta.BetaMessage;
}

describe("getAiConfig", () => {
  it("AI_MODEL が無ければ null", () => {
    expect(getAiConfig({})).toBeNull();
  });

  it("切り替え先のモデルは任意", () => {
    expect(getAiConfig({ AI_MODEL: "anthropic.claude-opus-5-5" })).toEqual({
      model: "anthropic.claude-opus-5-5",
      fallbackModel: null,
      claudeWorkspaceId: null,
    });
  });
});

describe("availableModels", () => {
  const ids = (env: Record<string, string>) => availableModels(getAiConfig(env)!).map((m) => m.id);

  it("Claude は Claude Platform on AWS のワークスペースが設定されているときだけ選べる", () => {
    expect(ids({ AI_MODEL: "qwen.qwen3-coder-480b-a35b-v1:0" })).not.toContain("claude-sonnet-5-5");
    expect(
      ids({ AI_MODEL: "qwen.qwen3-coder-480b-a35b-v1:0", ANTHROPIC_AWS_WORKSPACE_ID: "wrkspc_test" }),
    ).toContain("claude-sonnet-5-5");
    expect(ids({ AI_MODEL: "qwen.qwen3-coder-480b-a35b-v1:0" })).toContain("qwen.qwen3-coder-30b-a3b-v1:0");
  });

  it("Bedrock の Claude は設定なしで選べる", () => {
    expect(ids({ AI_MODEL: "qwen.qwen3-coder-480b-a35b-v1:0" })).toContain("jp.anthropic.claude-sonnet-4-6");
  });
});

describe("thinkingParams", () => {
  it.each([
    ["claude-opus-5-5", "medium"],
    ["jp.anthropic.claude-sonnet-4-6", "low"],
  ])("%s は adaptive thinking と effort: %s", (model, effort) => {
    expect(thinkingParams(model)).toEqual({ thinking: { type: "adaptive" }, output_config: { effort } });
  });

  it("Haiku 4.5 には何も送らない", () => {
    expect(thinkingParams("jp.anthropic.claude-haiku-4-5-20251001-v1:0")).toEqual({});
  });
});

describe("buildUserMessage", () => {
  it("履歴があれば先頭に、コードと依頼はその後に入れる", () => {
    const text = buildUserMessage({ source: SOURCE, prompt: "赤くして", history: [{ prompt: "太く", reply: "太くしました" }] });
    expect(text.indexOf("# Conversation so far")).toBeLessThan(text.indexOf(SOURCE));
    expect(text.endsWith("# Request\n\n赤くして")).toBe(true);
  });
});

describe("toFinalEvent", () => {
  it("返答文とツールに渡されたコードを取り出し、静的チェックする", () => {
    const event = toFinalEvent(
      message([
        { type: "thinking", thinking: "", signature: "x" },
        { type: "text", text: "赤くしました。" },
        { type: "tool_use", id: "t1", name: "propose_shader", input: { source: SOURCE.replace("0.5", "0.0") } },
      ]),
      ja,
    );
    expect(event).toEqual({ type: "done", reply: "赤くしました。", source: SOURCE.replace("0.5", "0.0"), errors: [] });
  });

  it("ツールを使わない返答はコードの提案なし", () => {
    expect(toFinalEvent(message([{ type: "text", text: "render は画素ごとに呼ばれます。" }], "end_turn"), ja)).toEqual({
      type: "done",
      reply: "render は画素ごとに呼ばれます。",
      source: null,
      errors: [],
    });
  });

  it("別のモデルに切り替わったら、切り替え前の出力は使わない", () => {
    const event = toFinalEvent(
      message([
        { type: "text", text: "途中まで" },
        { type: "fallback", from: { model: "a" }, to: { model: "b" } },
        { type: "text", text: "やり直しました。" },
        { type: "tool_use", id: "t2", name: "propose_shader", input: { source: "gl_FragCoord" } },
      ]),
      ja,
    );
    expect(event.type === "done" && event.reply).toBe("やり直しました。");
    expect(event.type === "done" && event.errors).toContain("gl_FragCoord は使えません");
  });

  it.each(["refusal", "max_tokens"] as const)("%s はエラーにする", (stopReason) => {
    expect(toFinalEvent(message([], stopReason), ja).type).toBe("error");
  });
});

describe("isClaudeModel", () => {
  it.each([
    ["anthropic.claude-opus-4-8", true],
    ["qwen.qwen3-coder-480b-a35b-v1:0", false],
  ])("%s → %s", (model, expected) => {
    expect(isClaudeModel(model)).toBe(expected);
  });
});

describe("parseCodeBlockReply", () => {
  it("説明文とコードブロックを分ける", () => {
    expect(parseCodeBlockReply(`赤くしました。\n\n\`\`\`glsl\n${SOURCE}\n\`\`\`\n`)).toEqual({
      reply: "赤くしました。",
      source: SOURCE,
    });
  });

  it("コードブロックの後に書かれた文も説明に含める", () => {
    expect(parseCodeBlockReply("変えました。\n```\nx\n```\n補足です。")).toEqual({
      reply: "変えました。\n\n補足です。",
      source: "x",
    });
  });

  it("コードブロックが無ければ提案なし", () => {
    expect(parseCodeBlockReply(" render は画素ごとに呼ばれます。 ")).toEqual({
      reply: "render は画素ごとに呼ばれます。",
      source: null,
    });
  });
});

describe("streamableReplyLength", () => {
  it.each([
    ["説明です。", 5],
    ["説明です。\n`", 6],
    ["説明です。\n``", 6],
    ["説明です。\n```glsl\nvec4", 6],
  ])("%j → %d", (text, expected) => {
    expect(streamableReplyLength(text)).toBe(expected);
  });
});

describe("systemPrompt", () => {
  it("説明文は依頼と同じ言語で。分からなければ画面の言語で書かせる", () => {
    for (const prompt of [systemPrompt(en), systemPromptCodeBlock(en)]) {
      expect(prompt).toContain('same language as the request under "# Request"');
      expect(prompt).toContain("write in English.");
    }
    expect(systemPrompt(ja)).toContain("write in Japanese.");
  });
});

describe("estimateAbortedTokens", () => {
  it("入力は分かればその数、出力は最初の反応からの時間 × 1 秒 100", () => {
    expect(estimateAbortedTokens({ inputChars: 3000, inputTokens: 900, firstResponseAt: 1000, abortedAt: 6500 })).toEqual({
      inputTokens: 900,
      outputTokens: 550,
    });
  });

  it("入力の数が分からなければ文字数 ÷ 3。反応の前に止めたら出力は 0", () => {
    expect(estimateAbortedTokens({ inputChars: 3001, inputTokens: null, firstResponseAt: null, abortedAt: 5000 })).toEqual({
      inputTokens: 1001,
      outputTokens: 0,
    });
  });

  it("出力は 1 回の上限(16,000)を超えない", () => {
    const estimate = estimateAbortedTokens({ inputChars: 0, inputTokens: 0, firstResponseAt: 0, abortedAt: 600_000 });
    expect(estimate.outputTokens).toBe(16000);
  });
});

describe("watchAiRequest", () => {
  const options = (signal: AbortSignal) => ({ signal, model: "test-model", inputChars: 300, timeoutMs: 30 });
  /** 止められるまで返らない呼び出し(SDK と同じく、止められたら例外) */
  const hang = (signal: AbortSignal) =>
    new Promise<never>((_, reject) => signal.addEventListener("abort", () => reject(new Error("aborted"))));

  it("最初の反応が来なければ AiFirstResponseTimeoutError にする", async () => {
    const result = watchAiRequest(options(new AbortController().signal), (signal) => hang(signal));
    await expect(result).rejects.toBeInstanceOf(AiFirstResponseTimeoutError);
  });

  it("最初の反応が来れば、その後は時間がかかっても待つ", async () => {
    const result = await watchAiRequest(options(new AbortController().signal), async (_, onEvent) => {
      onEvent(120);
      await new Promise((resolve) => setTimeout(resolve, 60));
      return "done";
    });
    expect(result).toBe("done");
  });

  it("呼び出し元が止めたら AiAbortedError にし、分かった入力のトークン数を見積もりに使う", async () => {
    const caller = new AbortController();
    const result = watchAiRequest(options(caller.signal), (signal, onEvent) => {
      onEvent(120);
      setTimeout(() => caller.abort(), 5);
      return hang(signal);
    });
    await expect(result).rejects.toBeInstanceOf(AiAbortedError);
    const error = (await result.catch((e: unknown) => e)) as AiAbortedError;
    expect(error.model).toBe("test-model");
    expect(error.estimatedTokens.inputTokens).toBe(120);
  });
});
