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

// ---- Home(案 A+B ①)----

/** Home の Collection に並べる数(今日の 1 点の横に 2 つ + モザイク 6 つ) */
export const HOME_COLLECTION_COUNT = 8;
/** Home の New に並べる数(4 列 × 2 段) */
export const HOME_LATEST_COUNT = 8;

const DAY = 86_400_000;
const JST_OFFSET = 9 * 3_600_000;

/** 今日の 1 点が何番目か。日本時間の日付が変わるごとに 1 つずつ進み、一周したら最初に戻る */
export function pickIndex(count: number, now: number): number {
  if (count <= 0) return -1;
  return Math.floor((now + JST_OFFSET) / DAY) % count;
}

export interface HomeSelection<T> {
  /** 今日の 1 点。収蔵作品が無ければいちばん新しい作品 */
  pick: T | null;
  /** 今日の 1 点を除いた収蔵作品(新しく収蔵した順) */
  collection: T[];
  collectedTotal: number;
  /** 新しい順 */
  latest: T[];
  total: number;
}

/**
 * Home に出す作品を選ぶ。今日の 1 点は運営が手で選ばなくても毎日入れ替わるよう、
 * 収蔵作品を収蔵番号の順に 1 日 1 つずつ出す。
 */
export function selectHome<T extends Work>(all: T[], now: number): HomeSelection<T> {
  const works = numberCollection(all.filter(isPublicWork));
  const newest = sortWorks(works, "new");
  const collected = works.filter((work) => work.collected).sort((a, b) => (a.collectionNo ?? 0) - (b.collectionNo ?? 0));
  const pick = (collected.length > 0 ? collected[pickIndex(collected.length, now)] : newest[0]) ?? null;
  return {
    pick,
    collection: sortWorks(
      collected.filter((work) => work !== pick),
      "collected",
    ).slice(0, HOME_COLLECTION_COUNT),
    collectedTotal: collected.length,
    latest: newest.slice(0, HOME_LATEST_COUNT),
    total: works.length,
  };
}
