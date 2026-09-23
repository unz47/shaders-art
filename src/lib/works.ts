import type { MockWork } from "@/mocks/works/data";

// 既定は infra/(CDK)でデプロイ済みの本物のバックエンド(.env の NEXT_PUBLIC_API_BASE)。
// モックに戻したいときは NEXT_PUBLIC_API_MOCK=1 pnpm dev で上書きする。
const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

/** 詳細。GLSL 本体(source)を持つ */
export type Work = MockWork;
/** 一覧の 1 件ぶん。source は含まれない */
export type WorkSummary = Omit<Work, "source">;
export type WorksTab = "collection" | "new";

export async function getWorks(tab: WorksTab): Promise<WorkSummary[]> {
  const res = await fetch(`${BASE}/works?tab=${tab}`);
  if (!res.ok) throw new Error(`一覧を取得できませんでした (${res.status})`);
  const { items } = (await res.json()) as { items: WorkSummary[] };
  return items;
}

export async function getWork(slug: string): Promise<Work | null> {
  const res = await fetch(`${BASE}/works/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`作品を取得できませんでした (${res.status})`);
  return (await res.json()) as Work;
}
