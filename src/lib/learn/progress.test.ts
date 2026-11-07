import { describe, expect, it } from "vitest";
import { parseDone } from "./progress";

describe("parseDone", () => {
  it("保存してある slug の一覧を読む", () => {
    expect(parseDone('["first-shader","coordinates"]')).toEqual(["first-shader", "coordinates"]);
  });

  it("壊れた値や文字列以外は無視する", () => {
    expect(parseDone(null)).toEqual([]);
    expect(parseDone("{")).toEqual([]);
    expect(parseDone('{"a":1}')).toEqual([]);
    expect(parseDone('["a",1,null]')).toEqual(["a"]);
  });
});
