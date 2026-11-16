import type { Work } from "./works";

// 「すべての作品」(/works)の検索・並び替え・ページ分けと、Home に出す作品の選び方。
// /api/works・/api/home(本物)とモックの両方で使う。
// 作品が少ないうちは全件を読んでからここで絞り込んで並べる。増えてきたら GSI を足して Query に、
// 検索は全文検索のサービスに切り替える(2026-10 時点で作品は十数件)。

/** 並び順。画面に出す名前は lib/i18n の works.sort */
export type WorksSort = "new" | "popular" | "short";

export const WORKS_SORTS: readonly WorksSort[] = ["new", "popular", "short"];

/** 1 ページの件数(4 列 × 6 段) */
export const WORKS_PAGE_SIZE = 24;

export function parseSort(value: string | null | undefined): WorksSort {
  return value === "popular" || value === "short" ? value : "new";
}

export function parsePage(value: string | null | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

/** 検索語の長さの上限 */
export const SEARCH_QUERY_MAX = 100;

export function parseQuery(value: string | null | undefined): string {
  return (value ?? "").trim().slice(0, SEARCH_QUERY_MAX);
}

export function worksHref({ sort, page = 1, q = "" }: { sort: WorksSort; page?: number; q?: string }): string {
  const params = new URLSearchParams({ sort });
  if (page > 1) params.set("page", String(page));
  if (q) params.set("q", q);
  return `/works?${params}`;
}

/** 比べる前に揃える。全角・半角、大文字・小文字、カタカナ・ひらがなの違いを無視する */
function normalizeForSearch(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

/**
 * タイトル・作者名・タグ・説明のどこかに、空白で区切った言葉が全部入っていれば true(空なら全部 true)。
 * タグは #付きで並べておくので、「#noise」と書けばタグだけに当てられる。コードの中身は見ない
 */
export function matchesQuery(work: Pick<Work, "title" | "author" | "description" | "tags">, query: string): boolean {
  const terms = normalizeForSearch(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const text = normalizeForSearch(
    [work.title, work.author, work.description ?? "", ...work.tags.map((tag) => `#${tag}`)].join("\n"),
  );
  return terms.every((term) => text.includes(term));
}

/** visibility が無い既存作品は公開扱い */
export function isPublicWork(work: Pick<Work, "visibility">): boolean {
  return work.visibility === undefined || work.visibility === "public";
}

const favorites = (work: Work) => work.favoriteCount ?? 0;
// 同じ日時のときも並びが毎回変わらないよう、最後は slug で決める
const newestFirst = (a: Work, b: Work) => b.createdAt.localeCompare(a.createdAt) || a.slug.localeCompare(b.slug);

/** popular は「お気に入りの多い順。同じ数なら新しい順」 */
export function sortWorks<T extends Work>(works: T[], sort: WorksSort): T[] {
  const list = [...works];
  switch (sort) {
    case "new":
      return list.sort(newestFirst);
    case "popular":
      return list.sort((a, b) => favorites(b) - favorites(a) || newestFirst(a, b));
    case "short":
      return list.sort((a, b) => a.bytes - b.bytes || newestFirst(a, b));
  }
}

export interface WorksPage<T> {
  items: T[];
  page: number;
  pageCount: number;
  /** 検索語に合う公開作品の数(検索していなければ公開作品の数) */
  total: number;
}

/** 公開作品のうち検索語に合うものを、並べて 1 ページぶん切り出す。範囲外のページは items が空になる */
export function queryWorks<T extends Work>(
  all: T[],
  { sort, page, q = "" }: { sort: WorksSort; page: number; q?: string },
): WorksPage<T> {
  const sorted = sortWorks(
    all.filter((work) => isPublicWork(work) && matchesQuery(work, q)),
    sort,
  );
  const start = (page - 1) * WORKS_PAGE_SIZE;
  return {
    items: sorted.slice(start, start + WORKS_PAGE_SIZE),
    page,
    pageCount: Math.max(1, Math.ceil(sorted.length / WORKS_PAGE_SIZE)),
    total: sorted.length,
  };
}

// ---- Home(案 A+B ①)----

/** Home の Popular に並べる数(今日の 1 点の横に 2 つ + モザイク 6 つ) */
export const HOME_POPULAR_COUNT = 8;
/** Home の New に並べる数(4 列 × 2 段) */
export const HOME_LATEST_COUNT = 8;
/** 今日の 1 点を順に出す候補の数(1 週間で一周する) */
export const PICK_CANDIDATES = 7;

const DAY = 86_400_000;
const JST_OFFSET = 9 * 3_600_000;

/** 今日の 1 点が何番目か。日本時間の日付が変わるごとに 1 つずつ進み、一周したら最初に戻る */
export function pickIndex(count: number, now: number): number {
  if (count <= 0) return -1;
  return Math.floor((now + JST_OFFSET) / DAY) % count;
}

export interface HomeSelection<T> {
  /** 今日の 1 点 */
  pick: T | null;
  /** 今日の 1 点を除いた、お気に入りの多い作品(1 つ以上お気に入りされたもの) */
  popular: T[];
  /** 新しい順 */
  latest: T[];
  total: number;
}

/**
 * Home に出す作品を選ぶ。今日の 1 点は運営が手で選ばなくても入れ替わるよう、お気に入りの多い
 * 作品の上位から 1 日 1 つずつ出す。まだ誰もお気に入りにしていなければ、新しい作品から出す。
 */
export function selectHome<T extends Work>(all: T[], now: number): HomeSelection<T> {
  const works = all.filter(isPublicWork);
  const newest = sortWorks(works, "new");
  const popular = sortWorks(
    works.filter((work) => favorites(work) > 0),
    "popular",
  );
  const candidates = (popular.length > 0 ? popular : newest).slice(0, PICK_CANDIDATES);
  const pick = candidates[pickIndex(candidates.length, now)] ?? null;
  return {
    pick,
    popular: popular.filter((work) => work !== pick).slice(0, HOME_POPULAR_COUNT),
    latest: newest.slice(0, HOME_LATEST_COUNT),
    total: works.length,
  };
}
