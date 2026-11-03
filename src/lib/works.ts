import type { MockWork } from "@/mocks/works/data";
import type { SubmissionInput } from "@/lib/submission";

// 既定は同じアプリの Route Handler(/api)。本番も CDK がビルド時に "/api" を渡す。
// モックに戻したいときは NEXT_PUBLIC_API_MOCK=1 pnpm dev で上書きする。
const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

/** 詳細。GLSL 本体(source)を持つ */
export type Work = MockWork;
/** 一覧の 1 件ぶん。ホバー再生用に source も含む(詳細と同じ形) */
export type WorkSummary = Work;
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

/**
 * ログイン中の人の作品(非公開も含む、新しい順)。未ログインなら null。
 * セッションのクッキーを送るため、投稿と同じく常に同じオリジンの /api に送る。
 */
export async function getMyWorks(): Promise<WorkSummary[] | null> {
  const res = await fetch("/api/me/works", { cache: "no-store" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`作品を取得できませんでした (${res.status})`);
  const { items } = (await res.json()) as { items: WorkSummary[] };
  return items;
}

export type SubmitResult ={ ok: true; slug: string } | { ok: false; status: number; errors: string[] };

/**
 * 投稿(要ログイン)。セッションのクッキーを送るため、NEXT_PUBLIC_API_BASE ではなく
 * 常に同じオリジンの /api に送る。
 */
export async function submitWork(input: SubmissionInput): Promise<SubmitResult> {
  const res = await fetch("/api/works", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as { slug?: string; message?: string; errors?: string[] };
  if (res.ok && data.slug) return { ok: true, slug: data.slug };
  return { ok: false, status: res.status, errors: data.errors ?? [data.message ?? `投稿できませんでした (${res.status})`] };
}
