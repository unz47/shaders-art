import { describe, expect, it } from "vitest";
import { stillSize } from "./stillRenderer";

describe("stillSize", () => {
  it("表示の大きさに画素の密度を掛け、幅を 160px 刻みに切り上げる", () => {
    expect(stillSize(326, 204, 1)).toEqual({ width: 480, height: 300 });
    expect(stillSize(326, 204, 2)).toEqual({ width: 800, height: 501 });
  });

  it("画素の密度は 1〜2 倍に収める", () => {
    expect(stillSize(326, 204, 3)).toEqual(stillSize(326, 204, 2));
    expect(stillSize(326, 204, 0.5)).toEqual(stillSize(326, 204, 1));
  });

  it("幅は 160〜1280px に収め、縦横比は表示と同じにする", () => {
    expect(stillSize(40, 40, 1)).toEqual({ width: 160, height: 160 });
    expect(stillSize(1376, 540, 2)).toEqual({ width: 1280, height: 502 });
  });
});
