import { describe, expect, it } from "vitest";
import type { Work } from "./works";
import {
  matchesQuery,
  parsePage,
  parseQuery,
  parseSort,
  PICK_CANDIDATES,
  pickIndex,
  queryWorks,
  selectHome,
  sortWorks,
  WORKS_PAGE_SIZE,
  worksHref,
} from "./worksQuery";

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
    expect(parseSort("popular")).toBe("popular");
    expect(parseSort("short")).toBe("short");
    // 以前の「収蔵した順」の URL は新しい順で開く
    expect(parseSort("collected")).toBe("new");
    expect(parseSort(null)).toBe("new");
    expect(parsePage("3")).toBe(3);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("1.5")).toBe(1);
    expect(parsePage(undefined)).toBe(1);
  });

  it("1 ページ目は page を付けない", () => {
    expect(worksHref({ sort: "new" })).toBe("/works?sort=new");
    expect(worksHref({ sort: "popular", page: 2 })).toBe("/works?sort=popular&page=2");
  });

  it("検索語は前後の空白を落として q に入れる(空なら付けない)", () => {
    expect(parseQuery("  夕焼け  ")).toBe("夕焼け");
    expect(parseQuery(null)).toBe("");
    expect(parseQuery("x".repeat(200))).toHaveLength(100);
    expect(worksHref({ sort: "new", q: "夕焼け リング" })).toBe("/works?sort=new&q=%E5%A4%95%E7%84%BC%E3%81%91+%E3%83%AA%E3%83%B3%E3%82%B0");
    expect(worksHref({ sort: "short", page: 2, q: "" })).toBe("/works?sort=short&page=2");
  });
});

describe("matchesQuery", () => {
  const sunset = work("sunset", {
    title: "Sunset Rings",
    author: "トモヤ",
    description: "夕焼けのリングがゆっくり回る",
    tags: ["noise", "rings"],
  });

  it("タイトル・作者名・説明・タグのどれかに入っていれば合う", () => {
    expect(matchesQuery(sunset, "sunset")).toBe(true);
    expect(matchesQuery(sunset, "トモヤ")).toBe(true);
    expect(matchesQuery(sunset, "夕焼け")).toBe(true);
    expect(matchesQuery(sunset, "noise")).toBe(true);
    expect(matchesQuery(sunset, "plasma")).toBe(false);
  });

  it("空白で区切った言葉は全部入っているものだけ", () => {
    expect(matchesQuery(sunset, "夕焼け noise")).toBe(true);
    expect(matchesQuery(sunset, "夕焼け plasma")).toBe(false);
    // 全角の空白でも区切れる
    expect(matchesQuery(sunset, "夕焼け　rings")).toBe(true);
  });

  it("大文字・小文字、全角・半角、カタカナ・ひらがなの違いは無視する", () => {
    expect(matchesQuery(sunset, "SUNSET")).toBe(true);
    expect(matchesQuery(sunset, "ｓｕｎｓｅｔ")).toBe(true);
    expect(matchesQuery(sunset, "ﾄﾓﾔ")).toBe(true);
    expect(matchesQuery(sunset, "ともや")).toBe(true);
    expect(matchesQuery(sunset, "リング")).toBe(true);
  });

  it("# を付けるとタグだけに当たる", () => {
    expect(matchesQuery(sunset, "#rings")).toBe(true);
    expect(matchesQuery(sunset, "#sunset")).toBe(false);
  });

  it("空の検索語には全部合う", () => {
    expect(matchesQuery(sunset, "   ")).toBe(true);
  });
});

describe("sortWorks", () => {
  const works = [
    work("old", { createdAt: "2026-09-01T00:00:00Z", bytes: 300, favoriteCount: 2 }),
    work("new", { createdAt: "2026-10-10T00:00:00Z", bytes: 900 }),
    work("fav", { createdAt: "2026-09-15T00:00:00Z", bytes: 86, favoriteCount: 5 }),
    work("tie", { createdAt: "2026-09-20T00:00:00Z", bytes: 500, favoriteCount: 2 }),
  ];

  it("新しい順", () => {
    expect(slugs(sortWorks(works, "new"))).toEqual(["new", "tie", "fav", "old"]);
  });

  it("お気に入りが多い順(同じ数なら新しい順、まだ無いものは最後)", () => {
    expect(slugs(sortWorks(works, "popular"))).toEqual(["fav", "tie", "old", "new"]);
  });

  it("コードが短い順", () => {
    expect(slugs(sortWorks(works, "short"))).toEqual(["fav", "old", "tie", "new"]);
  });
});

describe("queryWorks", () => {
  const all = [
    ...Array.from({ length: 30 }, (_, i) =>
      work(`w${String(i).padStart(2, "0")}`, { createdAt: `2026-10-01T00:00:${String(i).padStart(2, "0")}Z` }),
    ),
    work("private", { visibility: "private", createdAt: "2026-12-01T00:00:00Z" }),
  ];

  it("非公開の作品を除き、24 件ずつに分ける", () => {
    const first = queryWorks(all, { sort: "new", page: 1 });
    expect(first.items).toHaveLength(WORKS_PAGE_SIZE);
    expect(first.items[0]?.slug).toBe("w29");
    expect(first).toMatchObject({ page: 1, pageCount: 2, total: 30 });
    expect(slugs(first.items)).not.toContain("private");
    expect(queryWorks(all, { sort: "new", page: 2 }).items).toHaveLength(30 - WORKS_PAGE_SIZE);
  });

  it("範囲外のページは空", () => {
    expect(queryWorks(all, { sort: "new", page: 9 }).items).toEqual([]);
  });

  it("検索語があれば、合う公開作品だけを数えて並べる", () => {
    const works = [
      work("a", { title: "Plasma", createdAt: "2026-10-01T00:00:00Z" }),
      work("b", { title: "Plasma Waves", createdAt: "2026-10-02T00:00:00Z" }),
      work("c", { title: "Clouds" }),
      work("d", { title: "Plasma (draft)", visibility: "private" }),
    ];
    const result = queryWorks(works, { sort: "new", page: 1, q: "plasma" });
    expect(slugs(result.items)).toEqual(["b", "a"]);
    expect(result).toMatchObject({ total: 2, pageCount: 1 });
  });
});

describe("pickIndex", () => {
  it("日本時間の 0 時で次に進み、一周したら戻る", () => {
    const day1 = Date.parse("2026-10-22T14:59:00Z"); // 日本時間 10/22 23:59
    const day2 = Date.parse("2026-10-22T15:00:00Z"); // 日本時間 10/23 0:00
    expect(pickIndex(5, day2)).toBe((pickIndex(5, day1) + 1) % 5);
    expect(pickIndex(5, day1 + 5 * 86_400_000)).toBe(pickIndex(5, day1));
    expect(pickIndex(0, day1)).toBe(-1);
  });
});

describe("selectHome", () => {
  it("今日の 1 点はお気に入りの多い作品から選び、Popular からは外す", () => {
    const all = [
      work("f3", { favoriteCount: 3 }),
      work("f9", { favoriteCount: 9 }),
      work("f1", { favoriteCount: 1 }),
      work("n1", { createdAt: "2026-10-20T00:00:00Z" }),
      work("hidden", { visibility: "private", favoriteCount: 99 }),
    ];
    const now = Date.parse("2026-10-22T03:00:00Z");
    const home = selectHome(all, now);
    const expected = ["f9", "f3", "f1"][pickIndex(3, now)];
    expect(home.pick?.slug).toBe(expected);
    expect(slugs(home.popular)).toEqual(["f9", "f3", "f1"].filter((s) => s !== expected));
    expect(home.total).toBe(4);
    expect(home.latest[0]?.slug).toBe("n1");
  });

  it("候補はお気に入りの多い上位だけ", () => {
    const all = Array.from({ length: 20 }, (_, i) => work(`w${String(i).padStart(2, "0")}`, { favoriteCount: 100 - i }));
    const top = new Set(slugs(sortWorks(all, "popular").slice(0, PICK_CANDIDATES)));
    for (let day = 0; day < 30; day++) expect(top.has(selectHome(all, day * 86_400_000).pick?.slug ?? "")).toBe(true);
  });

  it("まだ誰もお気に入りにしていなければ、新しい作品から選び、Popular は空", () => {
    const home = selectHome([work("a", { createdAt: "2026-10-01T00:00:00Z" }), work("b", { createdAt: "2026-10-02T00:00:00Z" })], 0);
    expect(["a", "b"]).toContain(home.pick?.slug);
    expect(home.popular).toEqual([]);
  });

  it("作品が無ければ空", () => {
    expect(selectHome([], 0)).toEqual({ pick: null, popular: [], latest: [], total: 0 });
  });
});
