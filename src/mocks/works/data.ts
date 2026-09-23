// list.ts と detail.ts が共有する仮データ。
// 6 作品ぶん。本物のレンダラはまだ無いので、bytes・source は
// Figma のデザイン値/参考コードに合わせた仮の値。

export interface MockWork {
  slug: string;
  title: string;
  author: string;
  bytes: number;
  license: string;
  thumbnail: string;
  collected: boolean;
  createdAt: string;
  description: string;
  tags: string[];
  /** vec4 render(vec2 uv, vec2 p) だけを提出する規約の GLSL 本体 */
  source: string;
}

export const works: MockWork[] = [
  {
    slug: "plasma",
    title: "Plasma",
    author: "tomoya",
    bytes: 555,
    license: "CC0-1.0",
    thumbnail: "/thumbs/plasma.png",
    collected: true,
    createdAt: "2026-09-15",
    description: "sin の位相を重ねただけの、いちばん古典的なプラズマ。時間で色相が回り続ける。",
    tags: ["classic", "sine"],
    source: `// Plasma — tomoya, 2026
// uniforms: time, resolution, attention

vec4 render(vec2 uv, vec2 p) {
  float v = 0.0;
  v += sin((p.x + time * 0.4) * 6.0);
  v += sin((p.y + time * 0.3) * 6.0);
  v += sin((p.x + p.y + time * 0.5) * 6.0);
  v += sin(length(p) * 6.0 - time);
  v *= 0.25;

  vec3 col = 0.5 + 0.5 * cos(6.28318 * (v + vec3(0.0, 0.33, 0.67)));
  return vec4(col, 1.0);
}`,
  },
  {
    slug: "frost-rings",
    title: "Frost Rings",
    author: "tomoya",
    bytes: 412,
    license: "CC0-1.0",
    thumbnail: "/thumbs/frost-rings.png",
    collected: true,
    createdAt: "2026-09-15",
    description: "中心から広がる氷の輪。カーソルが近づくと attention が上がって輪郭が揺らぎ、離れると静かに凍りつく。",
    tags: ["rings", "attention", "sdf"],
    source: `// Frost Rings — tomoya, 2026
// uniforms: time, resolution, attention

vec4 render(vec2 uv, vec2 p) {
  float r = length(p);
  float a = atan(p.y, p.x);

  // the rim wobbles only while someone is looking
  float wob = 0.06 * sin(5.0 * a + time * 0.8) * attention;
  float d = fract((r + wob) * 3.0 - time * 0.2) - 0.5;
  float ring = smoothstep(0.08, 0.0, abs(d) - 0.18);

  vec3 ice = vec3(0.55, 0.78, 0.86);
  vec3 col = mix(vec3(0.02, 0.03, 0.05), ice, ring);
  return vec4(col * (1.0 - 0.35 * r), 1.0);
}`,
  },
  {
    slug: "voronoi",
    title: "Voronoi Snow",
    author: "tomoya",
    bytes: 689,
    license: "CC0-1.0",
    thumbnail: "/thumbs/voronoi.png",
    collected: true,
    createdAt: "2026-09-15",
    description: "ボロノイの継ぎ目に霜を置いただけの、静かな夜空。粒はゆっくり流れていく。",
    tags: ["voronoi", "cells"],
    source: `// Voronoi Snow — tomoya, 2026
// uniforms: time, resolution, attention

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

vec4 render(vec2 uv, vec2 p) {
  vec2 q = p * 4.0 + vec2(0.0, time * 0.05);
  vec2 i = floor(q);
  vec2 f = fract(q);

  float minDist = 1.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 cell = vec2(float(x), float(y));
      vec2 point = hash2(i + cell);
      float d = length(cell + point - f);
      minDist = min(minDist, d);
    }
  }

  float star = smoothstep(0.06, 0.0, minDist);
  vec3 col = mix(vec3(0.02, 0.03, 0.06), vec3(0.9, 0.95, 1.0), star);
  return vec4(col, 1.0);
}`,
  },
  {
    slug: "tunnel",
    title: "Silver Tunnel",
    author: "tomoya",
    bytes: 498,
    license: "CC0-1.0",
    thumbnail: "/thumbs/tunnel.png",
    collected: true,
    createdAt: "2026-09-15",
    description: "極座標だけで作った銀色のトンネル。奥に吸い込まれるように時間を進める。",
    tags: ["tunnel", "polar"],
    source: `// Silver Tunnel — tomoya, 2026
// uniforms: time, resolution, attention

vec4 render(vec2 uv, vec2 p) {
  float r = length(p);
  float a = atan(p.y, p.x);

  float spokes = abs(sin(a * 8.0)) ;
  float rings = fract(1.0 / max(r, 0.05) - time * 0.6);

  float line = max(smoothstep(0.02, 0.0, spokes), smoothstep(0.04, 0.0, abs(rings - 0.5)));
  vec3 col = mix(vec3(0.02, 0.03, 0.05), vec3(0.7, 0.75, 0.82), line);
  return vec4(col, 1.0);
}`,
  },
  {
    slug: "clouds",
    title: "Snow Clouds",
    author: "tomoya",
    bytes: 555,
    license: "CC0-1.0",
    thumbnail: "/thumbs/clouds.png",
    collected: true,
    createdAt: "2026-09-15",
    description: "value noise の fBm。オクターブ数は 5 で固定した、ゆっくり流れる雲。",
    tags: ["fbm", "noise"],
    source: `// Snow Clouds — tomoya, 2026
// uniforms: time, resolution, attention

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

vec4 render(vec2 uv, vec2 p) {
  vec2 q = p * 2.0 + vec2(time * 0.1, 0.0);
  float n = fbm(q + fbm(q + time * 0.05));
  vec3 col = mix(vec3(0.04, 0.05, 0.08), vec3(0.75, 0.9, 0.96), smoothstep(0.3, 0.9, n));
  return vec4(col, 1.0);
}`,
  },
  {
    slug: "tiny",
    title: "Tiny",
    author: "tomoya",
    bytes: 86,
    license: "CC0-1.0",
    thumbnail: "/thumbs/tiny.png",
    collected: true,
    createdAt: "2026-09-15",
    description: "500 バイト縛りの企画展から。座標をそのまま色にしただけの、最小構成のグラデーション。",
    tags: ["tiny", "≤500bytes"],
    source: `// Tiny — tomoya, 2026
// uniforms: time, resolution, attention

vec4 render(vec2 uv, vec2 p) {
  return vec4(uv, 0.5 + 0.5 * sin(time), 1.0);
}`,
  },
];
