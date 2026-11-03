"use client";

import { useSyncExternalStore } from "react";
import { getMyFavorites, setFavorite, type WorkSummary } from "@/lib/works";

// ログイン中の人のお気に入り。ページの読み込みにつき 1 回だけ問い合わせ、カード・詳細ページ・Home で共有する。
// ♡ を押したら返事を待たずに見た目を変え(失敗したら戻す)、お気に入りの数も 1 つ増減させて見せる。
// 一覧から外したお気に入りも、ページを読み直すまでは並べたままにする(押し間違いをすぐ戻せるように)。

export type FavoritesState =
  | { status: "loading" }
  /** ログインしていない(押せない) */
  | { status: "signed-out" }
  | {
      status: "ready";
      /** 読み込んだときのお気に入り(新しくお気に入りにした順) */
      items: WorkSummary[];
      /** いまお気に入りになっている作品(押した結果を含む) */
      favorited: ReadonlySet<string>;
      /** 読み込んだときにお気に入りだった作品 */
      initial: ReadonlySet<string>;
    };

let state: FavoritesState = { status: "loading" };
let started = false;
const listeners = new Set<() => void>();
const serverState: FavoritesState = { status: "loading" };

function emit(next: FavoritesState) {
  state = next;
  for (const listener of listeners) listener();
}

async function load() {
  try {
    const items = await getMyFavorites();
    if (items === null) return emit({ status: "signed-out" });
    const slugs = new Set(items.map((work) => work.slug));
    emit({ status: "ready", items, favorited: slugs, initial: slugs });
  } catch {
    // 読めなかったときは押せない扱いにする(押しても保存できるか分からないので)
    emit({ status: "signed-out" });
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!started) {
    started = true;
    void load();
  }
  return () => listeners.delete(listener);
}

export function useFavorites(): FavoritesState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => serverState,
  );
}

/** 押した結果を反映した、作品のお気に入りの数 */
export function favoriteCountOf(work: Pick<WorkSummary, "slug" | "favoriteCount">, favorites: FavoritesState): number {
  const base = work.favoriteCount ?? 0;
  if (favorites.status !== "ready") return base;
  return base + (favorites.favorited.has(work.slug) ? 1 : 0) - (favorites.initial.has(work.slug) ? 1 : 0);
}

/** お気に入りにする・外す。先に見た目を変え、保存に失敗したら戻して例外を投げる */
export async function toggleFavorite(slug: string): Promise<void> {
  if (state.status !== "ready") return;
  const on = !state.favorited.has(slug);
  const apply = (favorited: boolean) => {
    if (state.status !== "ready") return;
    const next = new Set(state.favorited);
    if (favorited) next.add(slug);
    else next.delete(slug);
    emit({ ...state, favorited: next });
  };
  apply(on);
  try {
    await setFavorite(slug, on);
  } catch (error) {
    apply(!on);
    throw error;
  }
}
