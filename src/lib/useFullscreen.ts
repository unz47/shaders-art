"use client";

import { type RefObject, useCallback, useSyncExternalStore } from "react";

// 要素の全画面表示(Fullscreen API)。iPhone の Safari のように要素の全画面に対応していない
// ブラウザでは supported が false になるので、呼ぶ側はボタンを出さない。
// 全画面になったかどうかは fullscreenchange で追う(Esc で抜けたときも拾える)。

function subscribe(callback: () => void) {
  document.addEventListener("fullscreenchange", callback);
  return () => document.removeEventListener("fullscreenchange", callback);
}

export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const supported = useSyncExternalStore(
    subscribe,
    () => document.fullscreenEnabled,
    () => false,
  );
  const active = useSyncExternalStore(
    subscribe,
    () => document.fullscreenElement !== null && document.fullscreenElement === ref.current,
    () => false,
  );

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    } else {
      // ユーザーの操作から呼ばないと断られる。断られても何もしない
      void ref.current?.requestFullscreen().catch(() => {});
    }
  }, [ref]);

  return { supported, active, toggle };
}
