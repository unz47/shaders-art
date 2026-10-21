import type { DiffLine } from "@/lib/lineDiff";

// 仕様: Figma "Shader / Desktop 1440 — Community + AI"(node 83:443)> code-area
// AI の提案を、今のコードとの行単位の差分で見せる(読み取り専用)。足した行は緑、消える行は赤。
// 行番号は提案のほうの番号で、消える行には付かない。余白と行の高さは ShaderCodeEditor に揃える。
const ROW_CLASS = {
  same: "border-transparent",
  added: "border-status-success-solid bg-status-success-subtle-bg",
  removed: "border-status-danger-solid bg-status-danger-subtle-bg",
} as const;

const NUMBER_CLASS = {
  same: "text-text-muted",
  added: "text-status-success-solid",
  removed: "text-status-danger-solid",
} as const;

export function CodeDiff({ lines }: { lines: DiffLine[] }) {
  return (
    <div className="flex-1 overflow-auto py-4 font-mono text-[13px] leading-[22px]">
      {/* 長い行で横スクロールしても、行の背景が右端まで続くように */}
      <div className="w-max min-w-full">
        {lines.map((line, i) => (
          <div key={i} className={`flex gap-5 border-l-2 pl-[22px] pr-6 ${ROW_CLASS[line.type]}`}>
            <span className={`min-w-4 shrink-0 select-none text-right ${NUMBER_CLASS[line.type]}`}>
              {line.type === "removed" ? "−" : line.newNo}
            </span>
            <span
              className={`whitespace-pre ${
                line.type === "removed" || /^\s*\/\//.test(line.text) ? "text-text-muted" : "text-text-primary"
              }`}
            >
              {line.text || " "}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
