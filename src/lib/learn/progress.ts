"use client";

import { useMemo, useSyncExternalStore } from "react";

// 学習の進み具合(終えた回の slug の一覧)。ログインは要らないので、このブラウザの localStorage に覚えておく。
// 同じブラウザのほかのタブで変えたときも合わせる(storage イベント)。

const KEY = "shaders-art:learn-done";
const EVENT = "shaders-art:learn-progress";

/** 保存してある文字列を slug の一覧に直す。壊れていたら空 */
export function parseDone(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/** 終えた回の slug。サーバーとハイドレーションの間は null(まだ分からない) */
export function useLessonsDone(): string[] | null {
  const raw = useSyncExternalStore<string | null>(subscribe, read, () => null);
  return useMemo(() => (raw === null ? null : parseDone(raw)), [raw]);
}

export function setLessonDone(slug: string, done: boolean) {
  const list = new Set(parseDone(read()));
  if (done) list.add(slug);
  else list.delete(slug);
  try {
    localStorage.setItem(KEY, JSON.stringify([...list]));
  } catch {
    // 覚えられなくても、学習そのものは続けられる
  }
  window.dispatchEvent(new Event(EVENT));
}
