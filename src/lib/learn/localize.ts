import type { Locale } from "@/lib/i18n";
import { COURSE, findLesson, LESSONS } from "./course";
import { dedent, localizeSource } from "./source";
import type { CoursePart, Lesson, LessonBlock, Text } from "./types";

// レッスンを、見る人の言語だけの形にする。サーバー(app/learn)で呼んで、結果だけをブラウザに渡す
// (30 回ぶんの日英の本文をまるごとブラウザに送らないように)。コードは字下げを取り、コメントを言語で絞る。

export type LocalizedBlock =
  | { type: "heading"; id: string; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[]; ordered: boolean }
  | { type: "note"; tone: "tip" | "warning"; text: string }
  | { type: "code"; source: string; caption: string | null }
  | { type: "playground"; source: string; caption: string | null; attentionSlider: boolean }
  | {
      type: "exercise";
      /** 課題の通し番号(1 から)。見出しの「課題 1」に使う */
      index: number;
      title: string;
      prompt: string;
      starter: string;
      solution: string;
      hints: string[];
      attentionSlider: boolean;
    };

export interface LessonLink {
  slug: string;
  number: number;
  title: string;
}

export interface LocalizedLesson {
  slug: string;
  /** 本文があるか。まだ書いていない回は「準備中」と出す */
  ready: boolean;
  number: number;
  total: number;
  partTitle: string;
  title: string;
  summary: string;
  minutes: number;
  goals: string[];
  blocks: LocalizedBlock[];
  /** 小見出しの一覧(この回の内容) */
  outline: { id: string; text: string }[];
  previous: LessonLink | null;
  next: LessonLink | null;
}

export interface CourseOutline {
  total: number;
  minutes: number;
  parts: {
    id: string;
    title: string;
    description: string;
    lessons: (LessonLink & { ready: boolean; summary: string; minutes: number; cover: string | null })[];
  }[];
}

function pick(text: Text, locale: Locale): string {
  return text[locale];
}

function link(lesson: Lesson | undefined, locale: Locale): LessonLink | null {
  if (!lesson) return null;
  return { slug: lesson.slug, number: LESSONS.indexOf(lesson) + 1, title: pick(lesson.title, locale) };
}

function localizeBlocks(blocks: LessonBlock[], locale: Locale): LocalizedBlock[] {
  let heading = 0;
  let exercise = 0;
  return blocks.map((block): LocalizedBlock => {
    switch (block.type) {
      case "heading":
        heading += 1;
        return { type: "heading", id: `section-${heading}`, text: pick(block.text, locale) };
      case "paragraph":
        return { type: "paragraph", text: pick(block.text, locale) };
      case "list":
        return { type: "list", items: block.items.map((item) => pick(item, locale)), ordered: block.ordered ?? false };
      case "note":
        return { type: "note", tone: block.tone ?? "tip", text: pick(block.text, locale) };
      case "code":
        return {
          type: "code",
          source: localizeSource(block.source, locale),
          caption: block.caption ? pick(block.caption, locale) : null,
        };
      case "playground":
        return {
          type: "playground",
          source: localizeSource(block.source, locale),
          caption: block.caption ? pick(block.caption, locale) : null,
          attentionSlider: block.attentionSlider ?? false,
        };
      case "exercise":
        exercise += 1;
        return {
          type: "exercise",
          index: exercise,
          title: pick(block.title, locale),
          prompt: pick(block.prompt, locale),
          starter: localizeSource(block.starter, locale),
          solution: localizeSource(block.solution, locale),
          hints: (block.hints ?? []).map((hint) => pick(hint, locale)),
          attentionSlider: block.attentionSlider ?? false,
        };
    }
  });
}

export function localizeLesson(slug: string, locale: Locale): LocalizedLesson | null {
  const found = findLesson(slug);
  if (!found) return null;
  const { lesson, number, part } = found;
  const blocks = localizeBlocks(lesson.blocks, locale);
  return {
    slug: lesson.slug,
    ready: lesson.blocks.length > 0,
    number,
    total: LESSONS.length,
    partTitle: pick(part.title, locale),
    title: pick(lesson.title, locale),
    summary: pick(lesson.summary, locale),
    minutes: lesson.minutes,
    goals: lesson.goals.map((goal) => pick(goal, locale)),
    blocks,
    outline: blocks.flatMap((block) => (block.type === "heading" ? [{ id: block.id, text: block.text }] : [])),
    previous: link(LESSONS[number - 2], locale),
    next: link(LESSONS[number], locale),
  };
}

export function localizeCourse(locale: Locale): CourseOutline {
  return {
    total: LESSONS.length,
    minutes: LESSONS.reduce((sum, lesson) => sum + lesson.minutes, 0),
    parts: COURSE.map((part: CoursePart) => ({
      id: part.id,
      title: pick(part.title, locale),
      description: pick(part.description, locale),
      lessons: part.lessons.map((lesson) => ({
        slug: lesson.slug,
        ready: lesson.blocks.length > 0,
        number: LESSONS.indexOf(lesson) + 1,
        title: pick(lesson.title, locale),
        summary: pick(lesson.summary, locale),
        minutes: lesson.minutes,
        cover: lessonCoverSource(lesson),
      })),
    })),
  };
}

/** 目次に出す絵のコード。cover → 最後の課題の見本(エラーを直す課題は除く)→ 最初の playground の順 */
export function lessonCoverSource(lesson: Lesson): string | null {
  if (lesson.cover) return dedent(lesson.cover);
  const exercise = lesson.blocks.findLast((b) => b.type === "exercise" && !b.starterHasError);
  if (exercise?.type === "exercise") return dedent(exercise.solution);
  const playground = lesson.blocks.find((b) => b.type === "playground" && !b.expectError);
  return playground?.type === "playground" ? dedent(playground.source) : null;
}
