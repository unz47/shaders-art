import { describe, expect, it } from "vitest";
import { localeFromAcceptLanguage, localePath, resolveLocale, splitLocalePath } from "./locale";

describe("localeFromAcceptLanguage", () => {
  it.each([
    ["ja,en-US;q=0.9,en;q=0.8", "ja"],
    ["en-US,en;q=0.9,ja;q=0.8", "en"],
    ["fr-FR,fr;q=0.9,ja;q=0.5,en;q=0.4", "ja"],
    ["en-GB", "en"],
    ["ja-JP", "ja"],
  ])("%s → %s", (header, expected) => {
    expect(localeFromAcceptLanguage(header)).toBe(expected);
  });

  it("q の大きいほうを選ぶ(書かれた順ではなく)", () => {
    expect(localeFromAcceptLanguage("en;q=0.3,ja;q=0.8")).toBe("ja");
  });

  it("対応していない言語だけなら null", () => {
    expect(localeFromAcceptLanguage("fr-FR,de;q=0.8")).toBeNull();
    expect(localeFromAcceptLanguage("")).toBeNull();
    expect(localeFromAcceptLanguage(null)).toBeNull();
    expect(localeFromAcceptLanguage("ja;q=0")).toBeNull();
  });
});

describe("resolveLocale", () => {
  it("Cookie で選んだ言語を一番に使う", () => {
    expect(resolveLocale({ cookie: "ja", acceptLanguage: "en-US" })).toBe("ja");
    expect(resolveLocale({ cookie: "en", acceptLanguage: "ja" })).toBe("en");
  });

  it("Cookie が無い・知らない値ならブラウザの言語、それも無ければ英語", () => {
    expect(resolveLocale({ cookie: undefined, acceptLanguage: "ja-JP,ja;q=0.9" })).toBe("ja");
    expect(resolveLocale({ cookie: "fr", acceptLanguage: "fr-FR" })).toBe("en");
    expect(resolveLocale({ cookie: null, acceptLanguage: null })).toBe("en");
  });
});

describe("localePath", () => {
  it.each([
    ["/learn", "/ja/learn"],
    ["/", "/ja"],
    ["/?utm_source=x", "/ja?utm_source=x"],
    ["/#top", "/ja#top"],
    ["/works?sort=new", "/ja/works?sort=new"],
    ["/terms#license", "/ja/terms#license"],
  ])("日本語: %s → %s", (path, expected) => {
    expect(localePath("ja", path)).toBe(expected);
  });

  it("英語はそのまま", () => {
    expect(localePath("en", "/learn")).toBe("/learn");
    expect(localePath("en", "/")).toBe("/");
  });

  it("サイトの外・/api・すでに言語の付いたパスは変えない", () => {
    expect(localePath("ja", "https://example.com/")).toBe("https://example.com/");
    expect(localePath("ja", "//example.com/")).toBe("//example.com/");
    expect(localePath("ja", "/api/auth/login?returnTo=%2F")).toBe("/api/auth/login?returnTo=%2F");
    expect(localePath("ja", "/ja/learn")).toBe("/ja/learn");
    expect(localePath("ja", "#section-1")).toBe("#section-1");
  });
});

describe("splitLocalePath", () => {
  it.each([
    ["/ja", "ja", "/"],
    ["/ja/", "ja", "/"],
    ["/ja/learn/raymarching", "ja", "/learn/raymarching"],
    ["/learn", null, "/learn"],
    ["/", null, "/"],
    // /ja で始まるだけの別のパスは日本語にしない
    ["/japan", null, "/japan"],
  ])("%s → %s %s", (pathname, locale, path) => {
    expect(splitLocalePath(pathname)).toEqual({ locale, path });
  });

  it("localePath と行き来できる", () => {
    for (const path of ["/", "/learn", "/s/plasma", "/works?sort=new"]) {
      expect(splitLocalePath(localePath("ja", path))).toEqual({ locale: "ja", path });
    }
  });
});
