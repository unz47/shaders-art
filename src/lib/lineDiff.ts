// AI の提案を今のコードと行単位で比べる(/edit の差分表示用)。
// 作品は 12 KB 以内(AI に送るコードでも 24 KB まで)で、多くても数百行なので、素直な LCS(行数の積に比例)で足りる。

export type DiffLine =
  | { type: "same"; text: string; newNo: number }
  | { type: "added"; text: string; newNo: number }
  | { type: "removed"; text: string };

/** 表を作ると重くなりすぎる大きさ。超えたら「全部消して全部足した」扱いにする */
const MAX_CELLS = 1_000_000;

export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split("\n");
  const b = after.split("\n");

  if ((a.length + 1) * (b.length + 1) > MAX_CELLS) {
    return [
      ...a.map((text): DiffLine => ({ type: "removed", text })),
      ...b.map((text, j): DiffLine => ({ type: "added", text, newNo: j + 1 })),
    ];
  }

  // lcs[i * w + j] = a[i..] と b[j..] の最長共通部分列の長さ
  const w = b.length + 1;
  const lcs = new Uint32Array((a.length + 1) * w);
  const at = (i: number, j: number) => lcs[i * w + j] ?? 0;
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i * w + j] = a[i] === b[j] ? at(i + 1, j + 1) + 1 : Math.max(at(i + 1, j), at(i, j + 1));
    }
  }

  const lines: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    const left = a[i];
    const right = b[j];
    if (left !== undefined && right !== undefined && left === right) {
      lines.push({ type: "same", text: right, newNo: j + 1 });
      i++;
      j++;
    } else if (left !== undefined && (right === undefined || at(i + 1, j) >= at(i, j + 1))) {
      // 置き換えは「消した行 → 足した行」の順に並ぶ
      lines.push({ type: "removed", text: left });
      i++;
    } else if (right !== undefined) {
      lines.push({ type: "added", text: right, newNo: j + 1 });
      j++;
    }
  }
  return lines;
}

export function diffStats(lines: DiffLine[]): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const line of lines) {
    if (line.type === "added") added++;
    else if (line.type === "removed") removed++;
  }
  return { added, removed };
}
