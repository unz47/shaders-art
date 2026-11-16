import { describe, expect, it } from "vitest";
import { buildStandaloneHtml, exportFileName, toShadertoy } from "./shaderExport";

const SOURCE = "vec4 render(vec2 uv, vec2 p) {\n  return vec4(uv, 0.5, 1.0);\n}";

describe("exportFileName", () => {
  it.each([
    ["Sunset Rings", "4k", "png", "sunset-rings-4k.png"],
    ["夕焼け", "", "html", "shader.html"],
    ["", "1080x1080", "png", "shader-1080x1080.png"],
  ])("%j → %s", (title, suffix, ext, expected) => {
    expect(exportFileName(title, suffix, ext)).toBe(expected);
  });
});

describe("toShadertoy", () => {
  it("uniform を Shadertoy の名前に寄せ、mainImage で render を呼ぶ", () => {
    const code = toShadertoy(SOURCE, { title: "Plasma" });
    expect(code.startsWith("// Plasma\n")).toBe(true);
    expect(code).toContain("#define time iTime");
    expect(code).toContain(SOURCE);
    expect(code).toContain("fragColor = render(uv, p);");
  });
});

describe("buildStandaloneHtml", () => {
  it("コードを JSON 文字列として埋め込み、</script> で HTML が壊れないようにする", () => {
    const html = buildStandaloneHtml(`${SOURCE}\n// </script><b>`, { title: "<Rings>" });
    expect(html).toContain("<title>&lt;Rings&gt; — shaders.art</title>");
    expect(html).not.toContain("</script><b>");
    expect(html).toContain("\\u003c/script>\\u003cb>");
    // 埋め込んだ文字列を取り出すと元のコードに戻る
    const embedded = /const RENDER = (".*");/.exec(html)?.[1] ?? "";
    expect(JSON.parse(embedded)).toBe(`${SOURCE}\n// </script><b>`);
  });
});
