"use client";

import { useSyncExternalStore } from "react";

// いまの時刻(1 分刻み)。「12 分前」のような表示に使う。1 分ごとに描き直す。
// サーバーで描くときは時刻が決まらないので null(呼ぶ側で日付などを出す)。

const MINUTE = 60_000;

function subscribe(onChange: () => void): () => void {
  const id = setInterval(onChange, MINUTE);
  return () => clearInterval(id);
}

const getSnapshot = () => Math.floor(Date.now() / MINUTE) * MINUTE;
const getServerSnapshot = () => null;

export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
