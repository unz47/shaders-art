"use client";

// 仕様: Figma "Edit / Desktop 1440"(node 63:444) > code-area
// CodeBlock(読み取り専用)の見た目を踏襲しつつ、textareaで編集可能にする。
// textarea自身はスクロールさせず(rows指定で行数ぶんの高さに固定)、行番号と
// 本文を外側のコンテナ1つだけでスクロールさせることで、行番号とコードが
// ズレないようにしている。
export function ShaderCodeEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const lineCount = value.split("\n").length;

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
        rows={lineCount}
        spellCheck={false}
        className="min-w-0 flex-1 resize-none overflow-hidden whitespace-pre bg-transparent font-mono text-[13px] leading-[22px] text-text-primary outline-none"
      />
    </div>
  );
}
