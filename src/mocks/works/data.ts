// list.ts と detail.ts が共有する仮データ。
// 6 作品ぶん。本物の GLSL は無いので、見た目を確かめるための仮の値
// (bytes は Figma のデザイン値に合わせている)。

export interface MockWork {
  slug: string;
  title: string;
  author: string;
  bytes: number;
  license: string;
  thumbnail: string;
  collected: boolean;
  createdAt: string;
}

export const works: MockWork[] = [
  { slug: "plasma", title: "Plasma", author: "tomoya", bytes: 555, license: "CC0-1.0", thumbnail: "/thumbs/plasma.png", collected: true, createdAt: "2026-09-15" },
  { slug: "frost-rings", title: "Frost Rings", author: "tomoya", bytes: 412, license: "CC0-1.0", thumbnail: "/thumbs/frost-rings.png", collected: true, createdAt: "2026-09-15" },
  { slug: "voronoi", title: "Voronoi Snow", author: "tomoya", bytes: 689, license: "CC0-1.0", thumbnail: "/thumbs/voronoi.png", collected: true, createdAt: "2026-09-15" },
  { slug: "tunnel", title: "Silver Tunnel", author: "tomoya", bytes: 498, license: "CC0-1.0", thumbnail: "/thumbs/tunnel.png", collected: true, createdAt: "2026-09-15" },
  { slug: "clouds", title: "Snow Clouds", author: "tomoya", bytes: 555, license: "CC0-1.0", thumbnail: "/thumbs/clouds.png", collected: true, createdAt: "2026-09-15" },
  { slug: "tiny", title: "Tiny", author: "tomoya", bytes: 86, license: "CC0-1.0", thumbnail: "/thumbs/tiny.png", collected: true, createdAt: "2026-09-15" },
];
