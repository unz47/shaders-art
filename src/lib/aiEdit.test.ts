import { describe, expect, it } from "vitest";
import {
  AI_HISTORY_MAX,
  AI_PROMPT_MAX,
  AI_SOURCE_MAX_BYTES,
  encodeSseEvent,
  parseSseEvents,
  validateAiEditRequest,
} from "./aiEdit";

describe("validateAiEditRequest", () => {
  it("依頼を整えて通し、履歴は直近だけ残す", () => {
    const history = Array.from({ length: AI_HISTORY_MAX + 2 }, (_, i) => ({ prompt: `p${i}`, reply: `r${i}` }));
    const result = validateAiEditRequest({ source: "x", prompt: "  赤くして  ", history: [...history, { prompt: 1 }] });
    expect(result.ok && result.value.prompt).toBe("赤くして");
    expect(result.ok && result.value.history.map((t) => t.prompt)).toEqual(
      history.slice(-AI_HISTORY_MAX).map((t) => t.prompt),
    );
  });

  it("モデルは一覧にあるものだけ通し、無ければ null(サーバーの既定)にする", () => {
    const chosen = validateAiEditRequest({ source: "x", prompt: "赤くして", model: "qwen.qwen3-coder-30b-a3b-v1:0" });
    expect(chosen.ok && chosen.value.model).toBe("qwen.qwen3-coder-30b-a3b-v1:0");
    const none = validateAiEditRequest({ source: "x", prompt: "赤くして" });
    expect(none.ok && none.value.model).toBeNull();
    expect(validateAiEditRequest({ source: "x", prompt: "赤くして", model: "anthropic.claude-opus-4-8" })).toEqual({
      ok: false,
      errors: ["選べないモデルです"],
    });
  });

  it.each([
    [null, "本文が JSON オブジェクトではありません"],
    [{ source: "x", prompt: "  " }, "依頼を入力してください"],
    [{ source: "x", prompt: "a".repeat(AI_PROMPT_MAX + 1) }, `依頼は ${AI_PROMPT_MAX} 文字以内にしてください`],
    [{ source: "x".repeat(AI_SOURCE_MAX_BYTES + 1), prompt: "a" }, "コードが長すぎます(24 KB まで)"],
  ])("不正な依頼を弾く: %j", (input, message) => {
    expect(validateAiEditRequest(input)).toEqual({ ok: false, errors: [message] });
  });
});

describe("parseSseEvents", () => {
  it("チャンクの途中で切れたイベントは次に持ち越し、ping は読み飛ばす", () => {
    const wire =
      encodeSseEvent({ type: "text", text: "こん" }) +
      ": ping\n\n" +
      encodeSseEvent({ type: "done", reply: "こんにちは", source: null, errors: [] });
    const cut = wire.length - 10;

    const first = parseSseEvents(wire.slice(0, cut));
    expect(first.events).toEqual([{ type: "text", text: "こん" }]);

    const second = parseSseEvents(first.rest + wire.slice(cut));
    expect(second.events).toEqual([{ type: "done", reply: "こんにちは", source: null, errors: [] }]);
    expect(second.rest).toBe("");
  });
});
