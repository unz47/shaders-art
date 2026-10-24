"use client";

import type { KeyboardEvent } from "react";

// 仕様: Figma "Edit / Desktop 1440"(node 63:444) > code-area
// CodeBlock(読み取り専用)の見た目を踏襲しつつ、textareaで編集可能にする。
// textarea自身はスクロールさせず(rows指定で行数ぶんの高さに固定)、行番号と
// 本文を外側のコンテナ1つだけでスクロールさせることで、行番号とコードが
// ズレないようにしている。
// ⌘Z / ⇧⌘Z(Ctrl+Z / Ctrl+Y)はテキストエリア標準の取り消しではなく、親の履歴
// (lib/editHistory.ts)を使う。AI の提案の適用などの差し替えも同じ履歴で戻せるように。
export function ShaderCodeEditor({
  value,
  onChange,
  onUndo,
  onRedo,
}: {
  value: string;
  onChange: (value: string) => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const lineCount = value.split("\n").length;

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === "z") {
      event.preventDefault();
      if (event.shiftKey) onRedo();
      else onUndo();
    } else if (key === "y" && event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      onRedo();
    }
  }

  return (
    <div className="flex flex-1 gap-5 overflow-auto px-6 py-4 font-mono text-[13px] leading-[22px]">
      <div className="shrink-0 select-none text-right text-text-muted">
        {Array.from({ length: lineCount }, (_, i) => (
          <p key={i}>{i + 1}</p>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={lineCount}
        spellCheck={false}
        className="min-w-0 flex-1 resize-none overflow-hidden whitespace-pre bg-transparent font-mono text-[13px] leading-[22px] text-text-primary outline-none"
      />
    </div>
  );
}
