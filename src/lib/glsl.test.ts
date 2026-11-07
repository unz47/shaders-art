import { describe, expect, it } from "vitest";
import { buildFragmentShader, formatShaderLog } from "./glsl";

describe("formatShaderLog", () => {
  const source = ["vec4 render(vec2 uv, vec2 p) {", "  vec3 c = vec3(1.0)", "  return vec4(c, 1.0);", "}"].join("\n");
  // Three.js が前に足す行の代わり
  const compiled = `#version 300 es\n#define A 1\n${buildFragmentShader(source)}`;
  const returnLine = compiled.split("\n").indexOf("  return vec4(c, 1.0);") + 1;

  it("作品のコードの中での行番号に直す", () => {
    const log = `ERROR: 0:${returnLine}: 'return' : syntax error\nERROR: 1 compilation errors.`;
    expect(formatShaderLog(log, compiled)).toBe("ERROR: 3: 'return' : syntax error\nERROR: 1 compilation errors.");
  });

  it("作品のコードより前の行のエラーと、全文が分からないときはそのまま", () => {
    expect(formatShaderLog("ERROR: 0:1: 'x' : bad", compiled)).toBe("ERROR: 0:1: 'x' : bad");
    expect(formatShaderLog("ERROR: 0:40: 'x' : bad", null)).toBe("ERROR: 0:40: 'x' : bad");
  });
});
