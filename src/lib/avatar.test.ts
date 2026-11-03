import { describe, expect, it } from "vitest";
import { avatarBackground, avatarHue, avatarInitial } from "./avatar";

describe("avatarInitial", () => {
  it("メールアドレスの頭文字を大文字で返す", () => {
    expect(avatarInitial("alice@example.com")).toBe("A");
    expect(avatarInitial("  bob@example.com")).toBe("B");
  });

  it("メールアドレスが無ければ ? を返す", () => {
    expect(avatarInitial(null)).toBe("?");
    expect(avatarInitial("")).toBe("?");
  });
});

describe("avatarHue", () => {
  it("同じ文字列なら同じ色相、0〜359 に収まる", () => {
    expect(avatarHue("alice@example.com")).toBe(avatarHue("alice@example.com"));
    for (const seed of ["", "a", "alice@example.com", "bob@example.com", "日本語@example.jp"]) {
      const hue = avatarHue(seed);
      expect(Number.isInteger(hue)).toBe(true);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    }
  });

  it("違う文字列なら、たいてい違う色相になる", () => {
    expect(avatarHue("alice@example.com")).not.toBe(avatarHue("bob@example.com"));
  });
});

describe("avatarBackground", () => {
  it("大文字小文字や前後の空白が違っても同じ色になる", () => {
    expect(avatarBackground("Alice@Example.com ")).toBe(avatarBackground("alice@example.com"));
  });
});
