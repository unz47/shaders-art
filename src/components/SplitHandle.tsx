"use client";

import { type KeyboardEvent, type PointerEvent, type RefObject, useRef } from "react";
import { useI18n } from "@/lib/i18n/client";

// /edit の欄どうしの境界。ドラッグ(またはフォーカスして矢印キー)で、後ろ側の欄の大きさの割合を変える。
// ダブルクリックで既定の大きさに戻す。
//   vertical   … 左右に分ける縦の線(コード欄とプレビュー欄)。← → で動かし、割合は右側の幅
//   horizontal … 上下に分ける横の線(コード欄と AI 欄)。↑ ↓ で動かし、割合は下側の高さ
// 見た目は 1px の線だが、つかみやすいように当たり判定は線の両側に広げてある。

const KEY_STEP = 0.02;

export function SplitHandle({
  containerRef,
  orientation = "vertical",
  label,
  ratio,
  minStartPx,
  minEndPx,
  onChange,
  onReset,
}: {
  /** 2 つの欄を並べている要素。割合はこの要素の幅(horizontal なら高さ)に対して計算する */
  containerRef: RefObject<HTMLElement | null>;
  orientation?: "vertical" | "horizontal";
  /** 読み上げ用の名前 */
  label: string;
  /** 後ろ側(右か下)の欄の大きさの割合(0〜1)。中身に合わせた大きさのままなら null */
  ratio: number | null;
  /** 前側(左か上)の欄の最小の大きさ */
  minStartPx: number;
  /** 後ろ側(右か下)の欄の最小の大きさ */
  minEndPx: number;
  onChange: (ratio: number) => void;
  onReset: () => void;
}) {
  const dragging = useRef(false);
  const { t } = useI18n();
  const vertical = orientation === "vertical";

  function clamp(next: number): number {
    const el = containerRef.current;
    const size = (vertical ? el?.clientWidth : el?.clientHeight) ?? 0;
    if (size <= minStartPx + minEndPx) return next;
    return Math.min(Math.max(next, minEndPx / size), 1 - minStartPx / size);
  }

  /** 線のいまの位置から割合を出す(ratio が null で、欄が中身に合わせた大きさのとき用) */
  function measuredRatio(handle: HTMLElement): number {
    const rect = containerRef.current?.getBoundingClientRect();
    const own = handle.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return 0;
    return vertical ? (rect.right - own.right) / rect.width : (rect.bottom - own.bottom) / rect.height;
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = true;
    // ドラッグ中はポインタが線から外れても、カーソルと選択の挙動を保つ
    document.body.style.cursor = vertical ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    onChange(
      clamp(vertical ? (rect.right - event.clientX) / rect.width : (rect.bottom - event.clientY) / rect.height),
    );
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    dragging.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // 境界を左(上)に動かす = 後ろ側の欄が広がる
    const grow = vertical ? "ArrowLeft" : "ArrowUp";
    const shrink = vertical ? "ArrowRight" : "ArrowDown";
    if (event.key !== grow && event.key !== shrink) return;
    event.preventDefault();
    const current = ratio ?? measuredRatio(event.currentTarget);
    onChange(clamp(current + (event.key === grow ? KEY_STEP : -KEY_STEP)));
  }

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      aria-label={label}
      aria-valuenow={ratio === null ? undefined : Math.round((1 - ratio) * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      title={vertical ? t.splitHandle.widthHint : t.splitHandle.heightHint}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={onReset}
      onKeyDown={handleKeyDown}
      className={`group relative z-10 shrink-0 touch-none bg-border-subtle outline-none ${
        vertical ? "w-px cursor-col-resize" : "h-px cursor-row-resize"
      }`}
    >
      {/* 当たり判定と、ホバー・ドラッグ中・フォーカス中の強調 */}
      <div
        className={`absolute flex justify-center ${vertical ? "inset-y-0 -left-1.5 -right-1.5" : "inset-x-0 -top-1.5 -bottom-1.5 flex-col"}`}
      >
        <div
          className={`bg-transparent transition-colors group-hover:bg-accent-default group-focus-visible:bg-accent-default group-active:bg-accent-default ${
            vertical ? "w-0.5" : "h-0.5"
          }`}
        />
      </div>
    </div>
  );
}
