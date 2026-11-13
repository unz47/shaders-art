// 投稿規約は vec4 render(vec2 uv, vec2 p) の本体だけ。ここでその本体を
// Three.js の ShaderMaterial で動くフラグメントシェーダーに包む。
// uv は 0-1、p は中心原点・アスペクト補正済みの座標(データ側の source が前提にしている座標系)。
// ShaderStage(詳細ページ)と ShaderThumbnail(一覧のホバー再生)で共有する。
export const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

/**
 * 作品のコードの直前に置く目印の行。コンパイルエラーの行番号を、作品のコードの中での行番号に
 * 直すのに使う(formatShaderLog)。Three.js が前に足す行の数は版によって変わるので、数えずに目印で探す
 */
export const SOURCE_MARKER = "// @render-source";

export function buildFragmentShader(source: string): string {
  return `
precision highp float;
varying vec2 vUv;
uniform float time;
uniform float attention;
uniform vec2 resolution;
// p と同じ座標系(中心原点・アスペクト補正済み)でのカーソル位置。
// マウスが乗っていない/追跡してない場合は (0, 0) のまま
uniform vec2 mouse;
${SOURCE_MARKER}
${source}

void main() {
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * 2.0;
  p.x *= resolution.x / resolution.y;
  gl_FragColor = render(uv, p);
}
`;
}

/**
 * コンパイラのエラーログ(例: `ERROR: 0:58: 'return' : syntax error`)の行番号を、作品のコードの中での
 * 行番号に直す(例: `ERROR: 3: 'return' : syntax error`)。compiledSource は GPU に渡した全文
 * (gl.getShaderSource)。目印が見つからないときや、作品のコードより前の行のエラーはそのまま返す
 */
export function formatShaderLog(log: string, compiledSource: string | null): string {
  if (!compiledSource) return log;
  const markerLine = compiledSource.split("\n").findIndex((line) => line.trim() === SOURCE_MARKER) + 1;
  if (markerLine === 0) return log;
  return log.replace(/\b0:(\d+)(?=:)/g, (match, line: string) => {
    const userLine = Number(line) - markerLine;
    return userLine >= 1 ? String(userLine) : match;
  });
}
