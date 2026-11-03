import { describe, expect, it } from "vitest";
import type { Work } from "./works";
import { numberCollection, parsePage, parseSort, queryWorks, sortWorks, WORKS_PAGE_SIZE, worksHref } from "./worksQuery";

function work(slug: string, fields: Partial<Work> = {}): Work {
  return {
    slug,
    title: slug,
    author: "a",
    bytes: 100,
    license: "CC0-1.0",
    thumbnail: "",
    collected: false,
    createdAt: "2026-10-01T00:00:00Z",
    description: "",
    tags: [],
    source: "",
    ...fields,
  };
}

const slugs = (works: Work[]) => works.map((w) => w.slug);

describe("parseSort / parsePage / worksHref", () => {
  it("知らない値は既定(新しい順・1 ページ目)にする", () => {
    expect(parseSort("collected")).toBe("collected");
    expect(parseSort("short")).toBe("short");
    expect(parseSort("popular")).toBe("new");
    expect(parseSort(null)).toBe("new");
    expect(parsePage("3")).toBe(3);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("1.5")).toBe(1);
    expect(parsePage(undefined)).toBe(1);
  });

  it("1 ページ目は page を付けない", () => {
    expect(worksHref({ sort: "new" })).toBe("/works?sort=new");
    expect(worksHref({ sort: "collected", page: 2 })).toBe("/works?sort=collected&page=2");
  });
});

describe("numberCollection", () => {
  it("収蔵日(無ければ投稿日)の古い順に 1 から番号を付け、未収蔵には付けない", () => {
    const numbered = numberCollection([
      work("b", { collected: true, collectedAt: "2026-10-05T00:00:00Z" }),
      work("a", { collected: true, createdAt: "2026-09-01T00:00:00Z" }),
      work("c", { collected: false }),
      work("d", { collected: true, collectedAt: "2026-10-03T00:00:00Z" }),
    ]);
    expect(numbered.map((w) => [w.slug, w.collectionNo])).toEqual([
      ["b", 3],
      ["a", 1],
      ["c", undefined],
      ["d", 2],
    ]);
  });
});

describe("sortWorks", () => {
  const works = numberCollection([
    work("old", { createdAt: "2026-09-01T00:00:00Z", bytes: 300 }),
    work("new", { createdAt: "2026-10-10T00:00:00Z", bytes: 900 }),
    work("c1", { collected: true, createdAt: "2026-09-15", collectedAt: "2026-09-20T00:00:00Z", bytes: 86 }),
    work("c2", { collected: true, createdAt: "2026-09-15", collectedAt: "2026-10-01T00:00:00Z", bytes: 500 }),
  ]);

  it("新しい順", () => {
    expect(slugs(sortWorks(works, "new"))).toEqual(["new", "c1", "c2", "old"]);
  });

  it("収蔵した順は、収蔵作品が先頭(新しく収蔵した順)、その後ろに未収蔵(新しい順)", () => {
    expect(slugs(sortWorks(works, "collected"))).toEqual(["c2", "c1", "new", "old"]);
  });

  it("コードが短い順", () => {
    expect(slugs(sortWorks(works, "short"))).toEqual(["c1", "old", "c2", "new"]);
  });
});

describe("queryWorks", () => {
  const all = [
    ...Array.from({ length: 30 }, (_, i) => work(`w${String(i).padStart(2, "0")}`, { createdAt: `2026-10-01T00:00:${String(i).padStart(2, "0")}Z` })),
    work("private", { visibility: "private", createdAt: "2026-12-01T00:00:00Z" }),
    work("c", { collected: true }),
  ];

  it("非公開の作品を除き、24 件ずつに分ける", () => {
    const first = queryWorks(all, { sort: "new", page: 1 });
    expect(first.items).toHaveLength(WORKS_PAGE_SIZE);
    expect(first.items[0]?.slug).toBe("w29");
    expect(first).toMatchObject({ page: 1, pageCount: 2, total: 31, collectedTotal: 1 });
    expect(slugs(first.items)).not.toContain("private");
    expect(queryWorks(all, { sort: "new", page: 2 }).items).toHaveLength(31 - WORKS_PAGE_SIZE);
  });

  it("範囲外のページは空", () => {
    expect(queryWorks(all, { sort: "new", page: 9 }).items).toEqual([]);
  });

  it("収蔵作品には番号が付いて返る", () => {
    expect(queryWorks(all, { sort: "collected", page: 1 }).items[0]).toMatchObject({ slug: "c", collectionNo: 1 });
  });
});
