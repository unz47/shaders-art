import { describe, expect, it } from "vitest";
import { localeFromAcceptLanguage, resolveLocale } from "./locale";

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
