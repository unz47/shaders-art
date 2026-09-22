// list.ts と detail.ts が共有する仮データ。
// 6 作品ぶん。本物の GLSL は無いので、見た目を確かめるための仮の値。

export interface MockWork {
  slug: string;
  title: string;
  author: string;
  bytes: number;
  license: string;
  color: string;
  collected: boolean;
  createdAt: string;
}

export const works: MockWork[] = [
  { slug: "plasma", title: "Plasma", author: "tomoya", bytes: 216, license: "CC0-1.0", color: "#f43f5e", collected: true, createdAt: "2026-09-15" },
  { slug: "frost-rings", title: "Frost Rings", author: "tomoya", bytes: 330, license: "CC0-1.0", color: "#38bdf8", collected: true, createdAt: "2026-09-15" },
  { slug: "voronoi", title: "Voronoi Snow", author: "tomoya", bytes: 526, license: "CC0-1.0", color: "#818cf8", collected: true, createdAt: "2026-09-15" },
  { slug: "tunnel", title: "Silver Tunnel", author: "tomoya", bytes: 373, license: "CC0-1.0", color: "#94a3b8", collected: true, createdAt: "2026-09-15" },
  { slug: "clouds", title: "Snow Clouds", author: "tomoya", bytes: 555, license: "CC0-1.0", color: "#a3e635", collected: true, createdAt: "2026-09-15" },
  { slug: "tiny", title: "Tiny", author: "tomoya", bytes: 81, license: "CC0-1.0", color: "#fbbf24", collected: true, createdAt: "2026-09-15" },
];
