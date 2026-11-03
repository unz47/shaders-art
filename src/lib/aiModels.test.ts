import { describe, expect, it } from "vitest";
import { AI_MODELS, DEFAULT_AI_MODEL_ID, findAiModel, priceTier } from "./aiModels";

describe("aiModels", () => {
  it("既定のモデルは一覧に入っていて、ID は重ならない", () => {
    expect(findAiModel(DEFAULT_AI_MODEL_ID)).toBeDefined();
    expect(new Set(AI_MODELS.map((m) => m.id)).size).toBe(AI_MODELS.length);
  });

  it("一覧に無いモデルは見つからない", () => {
    expect(findAiModel("anthropic.claude-opus-4-8")).toBeUndefined();
    expect(findAiModel(null)).toBeUndefined();
  });

  it("料金の目安は出力の料金で 3 段階", () => {
    expect(priceTier(findAiModel("qwen.qwen3-coder-30b-a3b-v1:0")!)).toBe(1);
    expect(priceTier(findAiModel("qwen.qwen3-coder-480b-a35b-v1:0")!)).toBe(2);
    expect(priceTier(findAiModel("moonshotai.kimi-k2.5")!)).toBe(3);
  });
});
