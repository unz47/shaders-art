import { describe, expect, it } from "vitest";
import { decodePendingLogin, encodePendingLogin, getAuthConfig, pkceChallenge, safeReturnTo } from "./oauth";

describe("pkceChallenge", () => {
  it("RFC 7636 付録 B の例と一致する", () => {
    expect(pkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });
});

describe("safeReturnTo", () => {
  it.each([
    ["/edit", "/edit"],
    ["/s/plasma/?x=1", "/s/plasma/?x=1"],
    [null, "/"],
    ["", "/"],
    ["https://evil.example/", "/"],
    ["//evil.example/", "/"],
    ["/\\evil.example/", "/"],
    ["edit", "/"],
  ])("%s → %s", (input, expected) => {
    expect(safeReturnTo(input)).toBe(expected);
  });
});

describe("pending login cookie", () => {
  it("往復できる", () => {
    const pending = { state: "s", verifier: "v", returnTo: "/edit" };
    expect(decodePendingLogin(encodePendingLogin(pending))).toEqual(pending);
  });

  it("壊れた値や欠けた値は null", () => {
    expect(decodePendingLogin(undefined)).toBeNull();
    expect(decodePendingLogin("not-base64-json")).toBeNull();
    expect(decodePendingLogin(Buffer.from(JSON.stringify({ state: "s" })).toString("base64url"))).toBeNull();
  });

  it("戻り先が外部 URL なら / にする", () => {
    const value = Buffer.from(JSON.stringify({ state: "s", verifier: "v", returnTo: "https://evil.example" })).toString(
      "base64url",
    );
    expect(decodePendingLogin(value)?.returnTo).toBe("/");
  });
});

describe("getAuthConfig", () => {
  it("3 つ揃っていなければ null", () => {
    expect(getAuthConfig({ COGNITO_USER_POOL_ID: "p", COGNITO_CLIENT_ID: "c" })).toBeNull();
  });

  it("ドメインの末尾スラッシュを落とす", () => {
    const env = { COGNITO_USER_POOL_ID: "p", COGNITO_CLIENT_ID: "c", COGNITO_DOMAIN: "https://x.auth.example.com/" };
    expect(getAuthConfig(env)?.domain).toBe("https://x.auth.example.com");
  });
});
