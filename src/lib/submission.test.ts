import { describe, expect, it } from "vitest";
import { en } from "./i18n/en";
import { ja } from "./i18n/ja";
import { SIZE_BUDGET_BYTES, slugify, validateSubmission } from "./submission";

const SOURCE = "vec4 render(vec2 uv, vec2 p) {\n  return vec4(uv, 0.5, 1.0);\n}";
const VALID = { title: "  Plasma  ", source: SOURCE, license: "shaders-art-standard" };

describe("validateSubmission", () => {
  it("正しい投稿を正規化して通す", () => {
    const result = validateSubmission({ ...VALID, tags: "Sine, #classic, sine", description: " 古典 " }, ja.submission);
    expect(result).toEqual({
      ok: true,
      value: {
        title: "Plasma",
        source: SOURCE,
        license: "shaders-art-standard",
        visibility: "public",
        author: "Anonymous",
        description: "古典",
        tags: ["sine", "classic"],
        bytes: new TextEncoder().encode(SOURCE).length,
      },
    });
  });

  it("名前があればそれを使う", () => {
    const result = validateSubmission({ ...VALID, author: " tomoya " }, ja.submission);
    expect(result.ok && result.value.author).toBe("tomoya");
  });

  it("CC BY 4.0 も選べる", () => {
    const result = validateSubmission({ ...VALID, license: "CC-BY-4.0" }, ja.submission);
    expect(result.ok && result.value.license).toBe("CC-BY-4.0");
  });

  it.each([
    ["タイトルが空", { ...VALID, title: "   " }],
    ["サイズ超過", { ...VALID, source: SOURCE + "//" + "x".repeat(SIZE_BUDGET_BYTES) }],
    ["render が無い", { ...VALID, source: "void main() {}" }],
    ["gl_FragCoord を使う", { ...VALID, source: SOURCE.replace("uv, 0.5", "gl_FragCoord.xy, 0.5") }],
    ["ループ上限が大きすぎる", { ...VALID, source: SOURCE.replace("{", "{ for (int i = 0; i < 1000; i++) {}") }],
    ["while ループ", { ...VALID, source: SOURCE.replace("{", "{ while (true) {}") }],
    ["未知のライセンス", { ...VALID, license: "MIT" }],
    ["以前のライセンス(新しい投稿では選べない)", { ...VALID, license: "CC0-1.0" }],
    ["タグが多すぎる", { ...VALID, tags: ["a", "b", "c", "d", "e", "f"] }],
    ["タグに使えない文字", { ...VALID, tags: ["日本語"] }],
  ])("%s なら弾く", (_label, input) => {
    const result = validateSubmission(input, ja.submission);
    expect(result.ok).toBe(false);
  });

  it("理由は渡した言語の文言で返す", () => {
    const result = validateSubmission({ ...VALID, title: " " }, en.submission);
    expect(!result.ok && result.errors).toContain("Enter a title");
  });

  it("オブジェクト以外は弾く", () => {
    expect(validateSubmission(null, ja.submission).ok).toBe(false);
    expect(validateSubmission("x", ja.submission).ok).toBe(false);
  });
});

describe("slugify", () => {
  it("英数字以外をハイフンにする", () => {
    expect(slugify("Domain Warp #2!")).toBe("domain-warp-2");
  });

  it("英数字が残らなければ work にする", () => {
    expect(slugify("波の模様")).toBe("work");
  });

  it("長いタイトルは 40 文字で切り、末尾のハイフンを落とす", () => {
    const slug = slugify("a".repeat(39) + " b");
    expect(slug).toBe("a".repeat(39));
  });
});
