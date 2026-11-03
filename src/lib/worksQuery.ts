import type { Work } from "./works";

// 「すべての作品」(/works)の並び替えとページ分け。/api/works(本物)とモックの両方で使う。
// 作品が少ないうちは全件を読んでからここで並べる。増えてきたら GSI を足して Query に切り替える。

export type WorksSort = "new" | "collected" | "short";

export const WORKS_SORT_LABELS: Record<WorksSort, string> = {
  new: "新しい順",
  collected: "収蔵した順",
  short: "コードが短い順",
};

/** 1 ページの件数(4 列 × 6 段) */
export const WORKS_PAGE_SIZE = 24;

export function parseSort(value: string | null | undefined): WorksSort {
  return value === "collected" || value === "short" ? value : "new";
}

export function parsePage(value: string | null | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export function worksHref({ sort, page = 1 }: { sort: WorksSort; page?: number }): string {
  const params = new URLSearchParams({ sort });
  if (page > 1) params.set("page", String(page));
  return `/works?${params}`;
}

/** visibility が無い既存作品は公開扱い */
export function isPublicWork(work: Pick<Work, "visibility">): boolean {
  return work.visibility === undefined || work.visibility === "public";
}

const collectedAt = (work: Work) => work.collectedAt ?? work.createdAt;
// 同じ日時のときも並びが毎回変わらないよう、最後は slug で決める
const newestFirst = (a: Work, b: Work) => b.createdAt.localeCompare(a.createdAt) || a.slug.localeCompare(b.slug);

/** 収蔵作品に収蔵番号を付ける。収蔵した日時(無ければ投稿日時)の古い順に 1, 2, 3… */
export function numberCollection<T extends Work>(works: T[]): T[] {
  const order = works
    .filter((work) => work.collected)
    .sort((a, b) => collectedAt(a).localeCompare(collectedAt(b)) || a.slug.localeCompare(b.slug));
  const numbers = new Map(order.map((work, i) => [work.slug, i + 1]));
  return works.map((work) => {
    const collectionNo = numbers.get(work.slug);
    return collectionNo === undefined ? work : { ...work, collectionNo };
  });
}

/**
 * collected は「収蔵作品を先頭に、新しく収蔵した順。その後ろに未収蔵の作品を新しい順」。
 * 収蔵番号を使うので、先に numberCollection を通しておくこと。
 */
export function sortWorks<T extends Work>(works: T[], sort: WorksSort): T[] {
  const list = [...works];
  switch (sort) {
    case "new":
      return list.sort(newestFirst);
    case "short":
      return list.sort((a, b) => a.bytes - b.bytes || newestFirst(a, b));
    case "collected":
      return list.sort((a, b) => {
        if (a.collected !== b.collected) return a.collected ? -1 : 1;
        if (a.collected) return (b.collectionNo ?? 0) - (a.collectionNo ?? 0);
        return newestFirst(a, b);
      });
  }
}

export interface WorksPage<T> {
  items: T[];
  page: number;
  pageCount: number;
  /** 公開作品の数 */
  total: number;
  /** そのうち収蔵作品の数 */
  collectedTotal: number;
}

/** 公開作品だけを、並べて 1 ページぶん切り出す。範囲外のページは items が空になる */
export function queryWorks<T extends Work>(all: T[], { sort, page }: { sort: WorksSort; page: number }): WorksPage<T> {
  const works = numberCollection(all.filter(isPublicWork));
  const sorted = sortWorks(works, sort);
  const start = (page - 1) * WORKS_PAGE_SIZE;
  return {
    items: sorted.slice(start, start + WORKS_PAGE_SIZE),
    page,
    pageCount: Math.max(1, Math.ceil(sorted.length / WORKS_PAGE_SIZE)),
    total: sorted.length,
    collectedTotal: works.filter((work) => work.collected).length,
  };
}
