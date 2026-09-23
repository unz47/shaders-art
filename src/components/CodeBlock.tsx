// 仕様: Figma "Shader / Desktop 1440" > Code > code-area(node 41:545)
// 行番号(右揃え・text-muted)と本文(Geist Mono)を横に並べるだけの、読み取り専用の表示。
// コメント行(// で始まる行)だけ薄い色にする。
export function CodeBlock({ source }: { source: string }) {
  const lines = source.split("\n");

  return (
    <div className="flex flex-1 gap-5 overflow-auto px-6 py-4 font-mono text-[13px] leading-[22px]">
      <div className="shrink-0 select-none text-right text-text-muted">
        {lines.map((_, i) => (
          <p key={i}>{i + 1}</p>
        ))}
      </div>
      <div className="min-w-0 flex-1 whitespace-pre">
        {lines.map((line, i) => (
          <p key={i} className={/^\s*\/\//.test(line) ? "text-text-muted" : "text-text-primary"}>
            {line || " "}
          </p>
        ))}
      </div>
    </div>
  );
}
