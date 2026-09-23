import type { MockWork } from "@/mocks/works/data";

// バックエンドができるまでの開発用。MSW が同じ URL を横取りして返す。
// 本物の API ができたら、この関数の中身だけ差し替える(呼び出し側は変えない)。
// 名前は HTTP メソッドに合わせる: GET /api/works → getWorks、GET /api/works/:slug → getWork

/** 詳細。GLSL 本体(source)を持つ */
export type Work = MockWork;
/** 一覧の 1 件ぶん。source は含まれない */
export type WorkSummary = Omit<Work, "source">;
export type WorksTab = "collection" | "new";

export async function getWorks(tab: WorksTab): Promise<WorkSummary[]> {
  const res = await fetch(`/api/works?tab=${tab}`);
  if (!res.ok) throw new Error(`一覧を取得できませんでした (${res.status})`);
  const { items } = (await res.json()) as { items: WorkSummary[] };
  return items;
}

export async function getWork(slug: string): Promise<Work | null> {
  const res = await fetch(`/api/works/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`作品を取得できませんでした (${res.status})`);
  return (await res.json()) as Work;
}
