import { describe, expect, it } from "vitest";
import { dedent, localizeSource } from "./source";

describe("dedent", () => {
  it("前後の空行と共通の字下げを取る(中の空行は残す)", () => {
    const source = `
        vec4 render(vec2 uv, vec2 p) {
          float a = 1.0;

          return vec4(a);
        }
      `;
    expect(dedent(source)).toBe(["vec4 render(vec2 uv, vec2 p) {", "  float a = 1.0;", "", "  return vec4(a);", "}"].join("\n"));
  });
});

describe("localizeSource", () => {
  const source = `
    //ja: 半径
    //en: radius
    float r = 0.5; //ja: 半分 //en: half
    float g = 0.2; // 印の無いコメント
    // r = 1.0;    //ja: 試す //en: try
    float b = 0.1; //ja: 日本語だけ
  `;

  it("日本語だけを残す", () => {
    expect(localizeSource(source, "ja")).toBe(
      ["// 半径", "float r = 0.5; // 半分", "float g = 0.2; // 印の無いコメント", "// r = 1.0;    // 試す", "float b = 0.1; // 日本語だけ"].join("\n"),
    );
  });

  it("英語だけを残す(英語の無いコメントは消し、行末の空白も取る)", () => {
    expect(localizeSource(source, "en")).toBe(
      ["// radius", "float r = 0.5; // half", "float g = 0.2; // 印の無いコメント", "// r = 1.0;    // try", "float b = 0.1;"].join("\n"),
    );
  });
});
