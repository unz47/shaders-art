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

export function buildFragmentShader(source: string): string {
  return `
precision highp float;
varying vec2 vUv;
uniform float time;
uniform float attention;
uniform vec2 resolution;

${source}

void main() {
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * 2.0;
  p.x *= resolution.x / resolution.y;
  gl_FragColor = render(uv, p);
}
`;
}
