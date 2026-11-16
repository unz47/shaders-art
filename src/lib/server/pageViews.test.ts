import { describe, expect, it } from "vitest";
import { clientIp, isBot, parsePageView, visitorId } from "./pageViews";

describe("parsePageView", () => {
  it("パスと参照元のドメインを読む", () => {
    expect(parsePageView(JSON.stringify({ path: "/s/clouds", ref: "X.com" }))).toEqual({ path: "/s/clouds", ref: "x.com" });
    expect(parsePageView(JSON.stringify({ path: "/", ref: null }))).toEqual({ path: "/", ref: null });
  });

  it("クエリと # の後ろは残さない", () => {
    expect(parsePageView(JSON.stringify({ path: "/works?q=雲#top" }))).toEqual({ path: "/works", ref: null });
  });

  it("末尾の / はそろえる(トップの / はそのまま)", () => {
    expect(parsePageView(JSON.stringify({ path: "/s/clouds/" }))?.path).toBe("/s/clouds");
    expect(parsePageView(JSON.stringify({ path: "/" }))?.path).toBe("/");
  });

  it("形の違うもの・API・よそのオリジンは記録しない", () => {
    expect(parsePageView("not json")).toBeNull();
    expect(parsePageView(JSON.stringify({ path: "s/clouds" }))).toBeNull();
    expect(parsePageView(JSON.stringify({ path: "//evil.example/" }))).toBeNull();
    expect(parsePageView(JSON.stringify({ path: "/api/works" }))).toBeNull();
    expect(parsePageView(JSON.stringify({ path: "/" + "a".repeat(3000) }))).toBeNull();
  });

  it("ドメインでない参照元と、ログインの行き帰りは参照元にしない", () => {
    expect(parsePageView(JSON.stringify({ path: "/", ref: "https://x.com/a" }))?.ref).toBeNull();
    expect(parsePageView(JSON.stringify({ path: "/", ref: "shaders.auth.ap-northeast-1.amazoncognito.com" }))?.ref).toBeNull();
  });
});

describe("visitorId", () => {
  it("同じ月の値・IP アドレス・ブラウザなら同じ、どれかが違えば違う", () => {
    const id = visitorId("salt-2026-11", "203.0.113.5", "Firefox");
    expect(id).toMatch(/^[0-9a-f]{16}$/);
    expect(visitorId("salt-2026-11", "203.0.113.5", "Firefox")).toBe(id);
    expect(visitorId("salt-2026-12", "203.0.113.5", "Firefox")).not.toBe(id);
    expect(visitorId("salt-2026-11", "203.0.113.6", "Firefox")).not.toBe(id);
  });
});

describe("clientIp / isBot", () => {
  it("X-Forwarded-For の先頭を使う", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.5, 130.176.0.1" }))).toBe("203.0.113.5");
    expect(clientIp(new Headers())).toBe("");
  });

  it("検索エンジンや表示確認のツールは数えない", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot("Mozilla/5.0 HeadlessChrome/140.0")).toBe(true);
    expect(isBot("")).toBe(true);
    expect(isBot("Mozilla/5.0 (Macintosh) Safari/605.1.15")).toBe(false);
  });
});
