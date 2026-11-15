// 作品の書き出しのうち、文字列を組み立てるだけのもの(単体 HTML・Shadertoy 用コード・ファイル名)。
// 作品は vec4 render(vec2 uv, vec2 p) の本体だけなので、どれも lib/glsl.ts の buildFragmentShader と
// 同じ座標系(uv は 0〜1、p は中心原点・縦 -1〜1・横はアスペクト比で伸びる)で包む。
// 静止画は Three.js で描くので lib/renderStill.ts にある。
// 書き出したファイルは誰が開くか分からないので、中に入る文言(コメント・エラー)は画面の言語に関わらず英語にする。

import { slugify } from "./submission";

export interface ExportMeta {
  /** 作品のタイトル。空なら Untitled */
  title: string;
}

/** 書き出すファイルの名前(拡張子付き)。タイトル由来で、英数字が残らなければ shader */
export function exportFileName(title: string, suffix: string, ext: string): string {
  const base = slugify(title);
  return `${base === "work" ? "shader" : base}${suffix ? `-${suffix}` : ""}.${ext}`;
}

function displayTitle(title: string): string {
  return title.trim() || "Untitled";
}

/**
 * Shadertoy の Image タブにそのまま貼れるコード。uniform は #define で Shadertoy の名前に寄せる。
 * - mouse は Shadertoy の iMouse(ピクセル)を p と同じ座標系に直す。クリックしていない間は (0,0) ではなく
 *   画面の左下(を p に直した値)になるので、shaders.art とは少し振る舞いが違う
 * - attention は Shadertoy には無いので、エディタのプレビューと同じ 0 にする
 */
export function toShadertoy(source: string, meta: ExportMeta): string {
  return [
    `// ${displayTitle(meta.title)}`,
    "// Exported for Shadertoy from shaders.art",
    "#define time iTime",
    "#define resolution iResolution.xy",
    "#define attention 0.0",
    "#define mouse ((iMouse.xy / iResolution.xy - 0.5) * 2.0 * vec2(iResolution.x / iResolution.y, 1.0))",
    "",
    source,
    "",
    "void mainImage(out vec4 fragColor, in vec2 fragCoord) {",
    "  vec2 uv = fragCoord / iResolution.xy;",
    "  vec2 p = (uv - 0.5) * 2.0;",
    "  p.x *= iResolution.x / iResolution.y;",
    "  fragColor = render(uv, p);",
    "}",
    "",
  ].join("\n");
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

/**
 * ブラウザで開くだけで動く 1 枚の HTML。Three.js は使わず WebGL2 を直接呼ぶ。
 * 作品のコードは JSON 文字列として埋め込む(</script> などで HTML が壊れないよう < はエスケープする)。
 */
export function buildStandaloneHtml(source: string, meta: ExportMeta): string {
  const title = escapeHtml(displayTitle(meta.title));
  const code = JSON.stringify(source).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — shaders.art</title>
<style>
  html, body { margin: 0; height: 100%; background: #000; }
  canvas { display: block; width: 100%; height: 100%; }
  #error { position: fixed; inset: 0; margin: 0; padding: 16px; color: #f88; font: 12px/1.5 monospace; white-space: pre-wrap; }
</style>
</head>
<body>
<canvas></canvas>
<pre id="error" hidden></pre>
<script>
// ${title} — exported from shaders.art
const RENDER = ${code};
const canvas = document.querySelector("canvas");
const errorView = document.getElementById("error");
const gl = canvas.getContext("webgl2");

function fail(message) {
  errorView.textContent = message;
  errorView.hidden = false;
  throw new Error(message);
}
if (!gl) fail("Open this file in a browser that supports WebGL2");

const VERTEX = \`#version 300 es
in vec2 position;
out vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}\`;
const FRAGMENT = \`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform float time;
uniform float attention;
uniform vec2 resolution;
uniform vec2 mouse;
\${RENDER}
void main() {
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * 2.0;
  p.x *= resolution.x / resolution.y;
  fragColor = render(uv, p);
}\`;

function compile(type, text) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, text);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) fail(gl.getShaderInfoLog(shader) || "Compilation failed");
  return shader;
}
const program = gl.createProgram();
gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) fail(gl.getProgramInfoLog(program) || "Linking failed");
gl.useProgram(program);

// One triangle that covers the whole screen
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
const position = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(position);
gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

const u = (name) => gl.getUniformLocation(program, name);
const uTime = u("time"), uAttention = u("attention"), uResolution = u("resolution"), uMouse = u("mouse");
let mouseX = 0, mouseY = 0;

function resize() {
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(canvas.clientWidth * scale);
  canvas.height = Math.round(canvas.clientHeight * scale);
  gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener("resize", resize);
resize();

// The mouse uses the same coordinates as p (origin at the center, -1 to 1 vertically)
canvas.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = ((event.clientX - rect.left) / rect.width - 0.5) * 2 * (rect.width / rect.height);
  mouseY = (0.5 - (event.clientY - rect.top) / rect.height) * 2;
});

const start = performance.now();
function frame(now) {
  gl.uniform1f(uTime, (now - start) / 1000);
  gl.uniform1f(uAttention, 0);
  gl.uniform2f(uResolution, canvas.width, canvas.height);
  gl.uniform2f(uMouse, mouseX, mouseY);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
</script>
</body>
</html>
`;
}

/** ブラウザにファイルとして保存させる */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  // クリック直後に解放するとダウンロードが始まらないことがあるので、少し待つ
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
