import { describe, expect, it } from "vitest";
import { commit, createHistory, HISTORY_LIMIT, redo, undo } from "./editHistory";

describe("editHistory", () => {
  it("記録した順に戻り、戻した分をやり直せる", () => {
    let h = commit(commit(createHistory("a"), "b"), "c");
    h = undo(h);
    expect(h.present).toBe("b");
    h = undo(h);
    expect(h.present).toBe("a");
    h = redo(h);
    expect(h.present).toBe("b");
    expect(h).toEqual({ past: ["a"], present: "b", future: ["c"] });
  });

  it("戻したあとに新しく記録すると、やり直しの履歴は消える", () => {
    const h = commit(undo(commit(createHistory("a"), "b")), "x");
    expect(h).toEqual({ past: ["a"], present: "x", future: [] });
  });

  it("今と同じ内容は記録しない", () => {
    const h = createHistory("a");
    expect(commit(h, "a")).toBe(h);
  });

  it("端では何もしない", () => {
    const h = createHistory("a");
    expect(undo(h)).toBe(h);
    expect(redo(h)).toBe(h);
  });

  it(`戻れるのは ${HISTORY_LIMIT} 段まで`, () => {
    let h = createHistory("0");
    for (let i = 1; i <= HISTORY_LIMIT + 10; i++) h = commit(h, String(i));
    expect(h.past).toHaveLength(HISTORY_LIMIT);
    expect(h.past[0]).toBe("10");
  });
});
