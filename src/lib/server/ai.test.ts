import type { Anthropic } from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import {
  availableModels,
  buildUserMessage,
  getAiConfig,
  isClaudeModel,
  parseCodeBlockReply,
  streamableReplyLength,
  toFinalEvent,
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
});

describe("buildUserMessage", () => {
  it("履歴があれば先頭に、コードと依頼はその後に入れる", () => {
    const text = buildUserMessage({ source: SOURCE, prompt: "赤くして", history: [{ prompt: "太く", reply: "太くしました" }] });
    expect(text.indexOf("これまでのやりとり")).toBeLessThan(text.indexOf(SOURCE));
    expect(text.endsWith("# 依頼\n\n赤くして")).toBe(true);
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
    );
    expect(event).toEqual({ type: "done", reply: "赤くしました。", source: SOURCE.replace("0.5", "0.0"), errors: [] });
  });

  it("ツールを使わない返答はコードの提案なし", () => {
    expect(toFinalEvent(message([{ type: "text", text: "render は画素ごとに呼ばれます。" }], "end_turn"))).toEqual({
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
    );
    expect(event.type === "done" && event.reply).toBe("やり直しました。");
    expect(event.type === "done" && event.errors).toContain("gl_FragCoord は使えません");
  });

  it.each(["refusal", "max_tokens"] as const)("%s はエラーにする", (stopReason) => {
    expect(toFinalEvent(message([], stopReason)).type).toBe("error");
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
