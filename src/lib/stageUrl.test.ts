import { describe, expect, it } from "vitest";
import {
  decodeSource,
  embedSnippet,
  encodeSource,
  parseStageOptions,
  sourceTokenFromHash,
  stageUrlForSource,
  stageUrlForWork,
} from "./stageUrl";
import { byteLength, SIZE_BUDGET_BYTES } from "./submission";

const SOURCE = "// 夕焼けのリング\nvec4 render(vec2 uv, vec2 p) {\n  return vec4(uv, 0.5, 1.0);\n}";

describe("encodeSource / decodeSource", () => {
  it("往復でき、URL に使えない文字を含まない", async () => {
    const token = await encodeSource(SOURCE);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await decodeSource(token)).toBe(SOURCE);
  });

  it("上限いっぱいの作品でも URL は数 KB に収まる", async () => {
    // 同じ行の繰り返しだと縮みすぎるので、数値と日本語のコメントを行ごとに変えて、上限の手前まで足す
    let full = SOURCE;
    for (let i = 0; ; i++) {
      const next = `${full}\n  float v${i} = sin(p.x * ${(i * 37) % 97}.${i % 10} + time) * ${(i * 53) % 89}.0; // 層 ${i} の揺れ`;
      if (byteLength(next) > SIZE_BUDGET_BYTES) break;
      full = next;
    }
    expect(byteLength(full)).toBeGreaterThan(SIZE_BUDGET_BYTES - 100);
    expect((await encodeSource(full)).length).toBeLessThan(8000);
  });
});

describe("URL", () => {
  it("下書きはコードを # に、公開作品は slug をパスに入れる", async () => {
    const url = await stageUrlForSource("https://example.com", SOURCE);
    expect(url.startsWith("https://example.com/stage#src=")).toBe(true);
    const token = sourceTokenFromHash(new URL(url).hash);
    expect(token && (await decodeSource(token))).toBe(SOURCE);
    expect(stageUrlForWork("https://example.com", "ink-bloom")).toBe("https://example.com/stage/ink-bloom");
  });

  it("# にコードが無ければ null", () => {
    expect(sourceTokenFromHash("")).toBeNull();
  });
});

describe("parseStageOptions", () => {
  it.each([
    ["", { speed: 1, attention: 0 }],
    ["?speed=0.5&attention=1", { speed: 0.5, attention: 1 }],
    ["?speed=100&attention=-3", { speed: 4, attention: 0 }],
    ["?speed=abc", { speed: 1, attention: 0 }],
  ])("%j", (search, expected) => {
    expect(parseStageOptions(search)).toEqual(expected);
  });
});

describe("embedSnippet", () => {
  it("属性を壊す文字はエスケープする", () => {
    const html = embedSnippet("https://example.com/stage/a", `"<Rings>"`);
    expect(html).toContain('title="&quot;&lt;Rings>&quot; — shaders.art"');
    expect(html).toContain('src="https://example.com/stage/a"');
  });
});
