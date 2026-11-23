import { describe, expect, it } from "vitest";
import { autoHideThreshold, isAdmin, isPublicWork, REPORT_NOTE_MAX, validateReport } from "./moderation";

describe("validateReport", () => {
  it("決まった理由と、前後の空白を取った説明を受け付ける", () => {
    expect(validateReport({ reason: "spam", note: "  宣伝です \n" })).toEqual({ reason: "spam", note: "宣伝です" });
    expect(validateReport({ reason: "other" })).toEqual({ reason: "other", note: "" });
  });

  it("知らない理由・形の違う値・長すぎる説明は受け付けない", () => {
    expect(validateReport({ reason: "nope" })).toBeNull();
    expect(validateReport({ reason: "spam", note: 1 })).toBeNull();
    expect(validateReport({ reason: "spam", note: "x".repeat(REPORT_NOTE_MAX + 1) })).toBeNull();
    expect(validateReport(null)).toBeNull();
    expect(validateReport("spam")).toBeNull();
  });
});

describe("isPublicWork", () => {
  it("visibility の無い既存作品は公開、非公開や運営・通報で非公開にした作品は公開でない", () => {
    expect(isPublicWork({})).toBe(true);
    expect(isPublicWork({ visibility: "public" })).toBe(true);
    expect(isPublicWork({ visibility: "private" })).toBe(false);
    expect(isPublicWork({ visibility: "public", hiddenBy: "operator" })).toBe(false);
    expect(isPublicWork({ hiddenBy: "reports" })).toBe(false);
  });
});

describe("isAdmin", () => {
  const env = { ADMIN_EMAILS: " Owner@Example.com ,, b@example.com" };

  it("一覧にある確認済みのアドレスだけが運営(大文字小文字は区別しない)", () => {
    expect(isAdmin({ email: "owner@example.com", emailVerified: true }, env)).toBe(true);
    expect(isAdmin({ email: "B@EXAMPLE.COM", emailVerified: true }, env)).toBe(true);
  });

  it("未確認のアドレス・一覧に無いアドレス・未ログイン・一覧が空なら運営ではない", () => {
    expect(isAdmin({ email: "owner@example.com", emailVerified: false }, env)).toBe(false);
    expect(isAdmin({ email: "c@example.com", emailVerified: true }, env)).toBe(false);
    expect(isAdmin({ email: null, emailVerified: true }, env)).toBe(false);
    expect(isAdmin(null, env)).toBe(false);
    expect(isAdmin({ email: "owner@example.com", emailVerified: true }, {})).toBe(false);
  });
});

describe("autoHideThreshold", () => {
  it("既定は 3。1 以上の整数なら変えられる", () => {
    expect(autoHideThreshold({})).toBe(3);
    expect(autoHideThreshold({ REPORT_AUTO_HIDE_THRESHOLD: "5" })).toBe(5);
    expect(autoHideThreshold({ REPORT_AUTO_HIDE_THRESHOLD: "0" })).toBe(3);
    expect(autoHideThreshold({ REPORT_AUTO_HIDE_THRESHOLD: "x" })).toBe(3);
  });
});
