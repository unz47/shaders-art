// 配信背景・壁紙・埋め込み用の全画面ページ(/stage)の URL を作る・読む。
// - 下書き: コードを圧縮して URL の # 以降(#src=…)に入れる。投稿しなくても使え、# 以降は
//   サーバーに送られない。作品は 4 KB 以内なので、圧縮すれば数 KB の URL に収まる
// - 公開作品: /stage/{slug}
// 見た目の調整は ? の後ろに付ける(speed: 再生速度の倍率、attention: 0〜1)。

/** UTF-8 → deflate-raw → base64url */
export async function encodeSource(source: string): Promise<string> {
  const stream = new Blob([source]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** encodeSource の逆。壊れた値なら例外になる */
export async function decodeSource(token: string): Promise<string> {
  const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return await new Response(stream).text();
}

/** 下書きのコードをそのまま入れた /stage の URL */
export async function stageUrlForSource(origin: string, source: string): Promise<string> {
  return `${origin}/stage#src=${await encodeSource(source)}`;
}

/** 公開作品の /stage の URL */
export function stageUrlForWork(origin: string, slug: string): string {
  return `${origin}/stage/${encodeURIComponent(slug)}`;
}

/** /stage の # 以降からコードの部分を取り出す。無ければ null */
export function sourceTokenFromHash(hash: string): string | null {
  return new URLSearchParams(hash.replace(/^#/, "")).get("src");
}

export interface StageOptions {
  /** 再生速度の倍率。0.1〜4 */
  speed: number;
  /** 0〜1。エディタのプレビューと同じ 0 が既定 */
  attention: number;
}

export function parseStageOptions(search: string): StageOptions {
  const params = new URLSearchParams(search);
  const clamp = (value: string | null, min: number, max: number, fallback: number) => {
    const n = value === null ? Number.NaN : Number(value);
    return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback;
  };
  return {
    speed: clamp(params.get("speed"), 0.1, 4, 1),
    attention: clamp(params.get("attention"), 0, 1, 0),
  };
}

function escapeAttribute(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/** 他のサイトに貼る埋め込みコード(16:9 で幅いっぱい) */
export function embedSnippet(url: string, title: string): string {
  const label = escapeAttribute(`${title.trim() || "Untitled"} — shaders.art`);
  return [
    `<div style="position:relative;aspect-ratio:16/9">`,
    `  <iframe src="${escapeAttribute(url)}" title="${label}" loading="lazy" allow="fullscreen" style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>`,
    `</div>`,
  ].join("\n");
}
