import { describe, expect, it } from "vitest";
import { dictionaryFor } from "../i18n";
import { lessonDescription, plainText } from "./describe";
import { LESSONS } from "./course";
import { localizeLesson } from "./localize";

describe("plainText", () => {
  it("本文の記法を外す", () => {
    expect(plainText("`sdSphere` と **床** を [前の回](/learn/rays-and-camera) で")).toBe("sdSphere と 床 を 前の回 で");
  });
});

describe("lessonDescription", () => {
  it("講座の何回目かと一言を必ず入れ、長くなりすぎない", () => {
    for (const locale of ["en", "ja"] as const) {
      const t = dictionaryFor(locale);
      for (const { slug } of LESSONS) {
        const lesson = localizeLesson(slug, locale);
        if (!lesson) throw new Error(slug);
        const text = lessonDescription(lesson, locale, t);
        expect(text.startsWith(t.meta.lesson(lesson.number, lesson.minutes))).toBe(true);
        expect(text).toContain(plainText(lesson.summary));
        // 記法の印(`・**・](…))が残っていない。コードの中の掛け算(p * n)は残してよい
        expect(text).not.toMatch(/`|\*\*|\]\(/);
        expect(text.length).toBeLessThanOrEqual(locale === "ja" ? 140 : 220);
      }
    }
  });

  it("短い回は「できるようになること」で説明を足す", () => {
    const lesson = localizeLesson("raymarching", "ja");
    if (!lesson) throw new Error("raymarching");
    expect(lessonDescription(lesson, "ja", dictionaryFor("ja"))).toBe(
      "無料の GLSL シェーダー入門講座、第 20 回(55 分)。距離関数を少しずつたどって、3D の形を描く。式で当たりを解けない形でも描ける理由(距離がわかれば安全に進める)を説明できる。",
    );
  });
});
