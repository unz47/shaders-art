"use client";

import { type KeyboardEvent, type PointerEvent, type RefObject, useRef } from "react";

// /edit のコード欄とプレビュー欄の境界。ドラッグ(またはフォーカスして ← →)で、
// 右側(プレビュー)の幅の割合を変える。ダブルクリックで既定の幅に戻す。
// 見た目は 1px の線だが、つかみやすいように当たり判定は左右に広げてある。

const KEY_STEP = 0.02;

export function SplitHandle({
  containerRef,
  ratio,
  minLeftPx,
  minRightPx,
  onChange,
  onReset,
}: {
  /** 左右の欄を並べている要素。幅の割合はこの要素の幅に対して計算する */
  containerRef: RefObject<HTMLElement | null>;
  /** 右側の幅の割合(0〜1) */
  ratio: number;
  minLeftPx: number;
  minRightPx: number;
  onChange: (ratio: number) => void;
  onReset: () => void;
}) {
  const dragging = useRef(false);

  function clamp(next: number): number {
    const width = containerRef.current?.clientWidth ?? 0;
    if (width <= minLeftPx + minRightPx) return next;
    return Math.min(Math.max(next, minRightPx / width), 1 - minLeftPx / width);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = true;
    // ドラッグ中はポインタが線から外れても、カーソルと選択の挙動を保つ
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    onChange(clamp((rect.right - event.clientX) / rect.width));
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    dragging.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // 境界を左に動かす = プレビューが広がる
    if (event.key === "ArrowLeft") onChange(clamp(ratio + KEY_STEP));
    else if (event.key === "ArrowRight") onChange(clamp(ratio - KEY_STEP));
    else return;
    event.preventDefault();
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="コード欄とプレビュー欄の境界"
      aria-valuenow={Math.round((1 - ratio) * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      title="ドラッグで幅を変える(ダブルクリックで元に戻す)"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={onReset}
      onKeyDown={handleKeyDown}
      className="group relative z-10 w-px shrink-0 cursor-col-resize touch-none bg-border-subtle outline-none"
    >
      {/* 当たり判定と、ホバー・ドラッグ中・フォーカス中の強調 */}
      <div className="absolute inset-y-0 -left-1.5 -right-1.5 flex justify-center">
        <div className="w-0.5 bg-transparent transition-colors group-hover:bg-accent-default group-focus-visible:bg-accent-default group-active:bg-accent-default" />
      </div>
    </div>
  );
}
