import { describe, expect, it } from "vitest";
import { diffLines, diffStats } from "./lineDiff";

describe("diffLines", () => {
  it("同じなら全部 same", () => {
    expect(diffLines("a\nb", "a\nb")).toEqual([
      { type: "same", text: "a", newNo: 1 },
      { type: "same", text: "b", newNo: 2 },
    ]);
  });

  it("置き換えは消した行 → 足した行の順に並び、行番号は提案のほう", () => {
    expect(diffLines("a\nb\nc", "a\nB\nx\nc")).toEqual([
      { type: "same", text: "a", newNo: 1 },
      { type: "removed", text: "b" },
      { type: "added", text: "B", newNo: 2 },
      { type: "added", text: "x", newNo: 3 },
      { type: "same", text: "c", newNo: 4 },
    ]);
  });

  it("先頭への追加と末尾の削除", () => {
    const lines = diffLines("a\nb", "// note\na");
    expect(lines).toEqual([
      { type: "added", text: "// note", newNo: 1 },
      { type: "same", text: "a", newNo: 2 },
      { type: "removed", text: "b" },
    ]);
    expect(diffStats(lines)).toEqual({ added: 1, removed: 1 });
  });

  it("大きすぎる入力は全部消して全部足した扱いにする", () => {
    const before = Array.from({ length: 1200 }, (_, i) => `a${i}`).join("\n");
    const after = Array.from({ length: 1200 }, (_, i) => `b${i}`).join("\n");
    expect(diffStats(diffLines(before, after))).toEqual({ added: 1200, removed: 1200 });
  });
});
