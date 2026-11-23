import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ja } from "../i18n/ja";
import { sourceErrors } from "../submission";
import { COURSE, findLesson, LESSONS } from "./course";
import { localizeCourse, localizeLesson } from "./localize";
import { dedent, localizeSource } from "./source";
import type { Lesson, Text } from "./types";

// コース全体の形の確認。シェーダーが本当にコンパイルできるかはブラウザでしか確かめられないので、
// ここでは投稿と同じ静的なチェック(lib/submission の sourceErrors)だけを通す。

function texts(value: unknown, out: Text[] = []): Text[] {
  if (Array.isArray(value)) value.forEach((v) => texts(v, out));
  else if (value && typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 2 && keys.includes("ja") && keys.includes("en")) out.push(value as Text);
    else Object.values(value).forEach((v) => texts(v, out));
  }
  return out;
}

function sources(lesson: Lesson): { source: string; expectError: boolean }[] {
  const list = lesson.cover ? [{ source: lesson.cover, expectError: false }] : [];
  for (const block of lesson.blocks) {
    if (block.type === "playground") list.push({ source: block.source, expectError: block.expectError ?? false });
    if (block.type === "exercise") {
      list.push({ source: block.starter, expectError: block.starterHasError ?? false });
      list.push({ source: block.solution, expectError: false });
    }
  }
  return list;
}

const WRITTEN = LESSONS.filter((lesson) => lesson.blocks.length > 0);

describe("学習のコース", () => {
  it("30 回あり、slug は重ならず、ファイル名の番号と並び順が合う", () => {
    expect(LESSONS).toHaveLength(30);
    expect(new Set(LESSONS.map((l) => l.slug)).size).toBe(LESSONS.length);
    const files = readdirSync(path.join(__dirname, "lessons")).filter((f) => f.endsWith(".ts")).sort();
    expect(files.map((f) => f.replace(/^\d+-/, "").replace(/\.ts$/, ""))).toEqual(LESSONS.map((l) => l.slug));
    expect(COURSE.flatMap((p) => p.lessons)).toEqual(LESSONS);
  });

  it.each(LESSONS.map((lesson) => [lesson.slug, lesson] as const))("%s: 題名と説明がそろっている", (_slug, lesson) => {
    expect(lesson.slug).toMatch(/^[a-z][a-z0-9-]*$/);
    expect(lesson.minutes).toBeGreaterThanOrEqual(30);
    expect(lesson.minutes).toBeLessThanOrEqual(60);
    for (const text of [lesson.title, lesson.summary]) {
      expect(text.ja.trim()).not.toBe("");
      expect(text.en.trim()).not.toBe("");
    }
  });

  // ここから下は、本文を書き終えた回だけ(まだの回は目次に「準備中」と出る)
  it.each(WRITTEN.map((lesson) => [lesson.slug, lesson] as const))("%s: 中身がそろっている", (_slug, lesson) => {
    expect(lesson.goals.length).toBeGreaterThanOrEqual(3);
    expect(lesson.blocks.length).toBeGreaterThan(0);
    expect(lesson.blocks.filter((b) => b.type === "exercise").length).toBeGreaterThanOrEqual(2);
    for (const text of texts(lesson)) {
      expect(text.ja.trim()).not.toBe("");
      expect(text.en.trim()).not.toBe("");
    }
    // 文の中のリンクは、あるレッスンか、サイトの中のページだけ
    for (const text of texts(lesson)) {
      for (const match of `${text.ja} ${text.en}`.matchAll(/\]\(([^)]+)\)/g)) {
        const href = match[1] ?? "";
        if (href.startsWith("/learn/")) expect(findLesson(href.slice(7).split("#")[0] ?? ""), href).not.toBeNull();
        else expect(href.startsWith("/") || href.startsWith("https://"), href).toBe(true);
      }
    }
  });

  it.each(WRITTEN.map((lesson) => [lesson.slug, lesson] as const))("%s: コードが投稿のルールを守る", (_slug, lesson) => {
    for (const { source, expectError } of sources(lesson)) {
      if (expectError) continue;
      expect(sourceErrors(dedent(source), ja.submission), dedent(source).slice(0, 80)).toEqual([]);
      // 行まるごとのコメントは日英で対にする(どちらの言語でも行番号が同じになるように)
      expect(localizeSource(source, "ja").split("\n").length).toBe(localizeSource(source, "en").split("\n").length);
    }
  });

  it("見る人の言語に絞れる", () => {
    const lesson = localizeLesson("first-shader", "en");
    expect(lesson?.number).toBe(1);
    expect(lesson?.previous).toBeNull();
    expect(lesson?.next?.slug).toBe("coordinates");
    expect(lesson?.outline.length).toBeGreaterThan(0);
    expect(JSON.stringify(lesson)).not.toMatch(/\/\/(ja|en):/);
    expect(localizeLesson("no-such-lesson", "ja")).toBeNull();
    const course = localizeCourse("ja");
    expect(course.parts.flatMap((p) => p.lessons).map((l) => l.number)).toEqual(LESSONS.map((_, i) => i + 1));
  });
});
