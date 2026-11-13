// レッスンのコードの整形。scripts/check-learn-shaders.ts が Node で直接読むので、ほかのファイルを import しない。
//
// 1. 字下げ: レッスンのファイルの中では、コードを周りに合わせて字下げして書く。表示する前に、
//    前後の空行と、すべての行に共通する先頭の空白を取り除く(dedent)
// 2. コメントの言語: コメントは日本語と英語を並べて書き、見る人の言語のほうだけを残す(localizeSource)
//      vec3 color = orange * 0.5; //ja: 半分の明るさ //en: half as bright
//      //ja: 1 行まるごとのコメント
//      //en: a whole-line comment
//    日本語なら 1 行目は `vec3 color = orange * 0.5; // 半分の明るさ` になり、3 行目(英語だけの行)は消える。
//    行まるごとのコメントは日本語と英語を必ず対にする(どちらの言語でも行番号が同じになるように)。
//    印の無い `//` のコメントは、どちらの言語でもそのまま出す。

export type SourceLocale = "ja" | "en";

export function dedent(source: string): string {
  const lines = source.replace(/\t/g, "  ").split("\n");
  while (lines.length > 0 && (lines[0] ?? "").trim() === "") lines.shift();
  while (lines.length > 0 && (lines.at(-1) ?? "").trim() === "") lines.pop();
  const indents = lines.filter((line) => line.trim() !== "").map((line) => line.length - line.trimStart().length);
  const common = indents.length > 0 ? Math.min(...indents) : 0;
  return lines.map((line) => (line.trim() === "" ? "" : line.slice(common).trimEnd())).join("\n");
}

const MARK = /\/\/(ja|en):/;
const SEGMENT = /\/\/(ja|en):\s*(.*?)\s*(?=\/\/(?:ja|en):|$)/g;

export function localizeSource(source: string, locale: SourceLocale): string {
  const out: string[] = [];
  for (const line of dedent(source).split("\n")) {
    const first = line.search(MARK);
    if (first === -1) {
      out.push(line);
      continue;
    }
    const code = line.slice(0, first);
    let text: string | undefined;
    for (const match of line.slice(first).matchAll(SEGMENT)) {
      if (match[1] === locale) text = match[2];
    }
    if (code.trim() === "") {
      // 行まるごとのコメント。ほかの言語の行は消す
      if (text) out.push(`${code}// ${text}`);
    } else {
      out.push(text ? `${code}// ${text}` : code.trimEnd());
    }
  }
  return out.join("\n");
}
