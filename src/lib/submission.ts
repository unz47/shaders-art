// 投稿のルール。/edit の Pre-publish checks(ブラウザ)と POST /api/works(サーバー)で共有する。
// コンパイル可否とフレーム時間はブラウザでしか測れないので、サーバーが確かめられるのは
// ここにある静的なチェックだけ。閾値は Notion でも「仮置き」扱い。
// サイズは 4 KB から 12 KB に広げた。コメント、特に日本語のコメント(UTF-8 で 1 文字 3 バイト)が多いと、
// コード自体は小さくてもすぐ超えていたため。本文が 8 KB を超える投稿も通るよう、WAF の本文サイズの
// ルールは数えるだけにしてある(infra/lib/waf-stack.ts)。

import type { Dictionary, Locale } from "./i18n";

export const SIZE_BUDGET_BYTES = 12 * 1024; // 12 KB
export const FRAME_TIME_BUDGET_MS = 8;
export const LOOP_ITERATION_BUDGET = 64;

export const TITLE_MAX = 60;
export const AUTHOR_MAX = 40;
export const DESCRIPTION_MAX = 280;
export const TAGS_MAX = 5;
const TAG_PATTERN = /^[a-z0-9][a-z0-9-]{0,23}$/;
export type WorkVisibility = "public" | "private";

// ライセンス。新しい投稿で選べるのは、YouTube と同じく「標準」(既定)と CC BY の 2 つだけ。
// 標準は利用規約(/terms#license)で、ほかの人にはサイトの機能の中での利用だけを許す。
// CC0 と CC BY-NC-SA は以前の投稿で選べたもので、その作品を表示するためだけに残している。
// 画面に出す名前と使い方の一言は lib/i18n の license。
export const LICENSES = [
  { id: "shaders-art-standard", short: "Standard", url: "/terms#license", selectable: true },
  { id: "CC-BY-4.0", short: "CC BY", url: "https://creativecommons.org/licenses/by/4.0/", selectable: true },
  { id: "CC0-1.0", short: "CC0", url: "https://creativecommons.org/publicdomain/zero/1.0/", selectable: false },
  { id: "CC-BY-NC-SA-4.0", short: "CC BY-NC-SA", url: "https://creativecommons.org/licenses/by-nc-sa/4.0/", selectable: false },
] as const;
export type LicenseId = (typeof LICENSES)[number]["id"];
export type License = (typeof LICENSES)[number];
export const DEFAULT_LICENSE: LicenseId = "shaders-art-standard";

export function findLicense(id: string): License | undefined {
  return LICENSES.find((l) => l.id === id);
}

/** ライセンスの説明ページ。標準は利用規約、CC はクリエイティブ・コモンズの説明(画面の言語で) */
export function licenseUrl(license: License, locale: Locale): string {
  return license.url.startsWith("/") ? license.url : `${license.url}deed.${locale}`;
}

/**
 * 投稿規約のエントリポイント vec4 render(vec2 uv, vec2 p)。引数名や in 修飾子は自由なので、
 * 戻り値の型と関数名だけを見る(引数が正しいかはブラウザでのコンパイルが確かめる)
 */
const RENDER_SIGNATURE = /\bvec4\s+render\s*\(/;

export function byteLength(source: string): number {
  return new TextEncoder().encode(source).length;
}

export function hasRenderSignature(source: string): boolean {
  return RENDER_SIGNATURE.test(source);
}

// for(...; i < N; ...) のNが数値リテラルのループだけを検出する簡易チェック。
// 変数を上限に使うループや while は判定できないので、それらは一律「要確認」(ok: null)扱いにする。
export function checkLoopsBounded(source: string, t: Dictionary["submission"]): { ok: boolean | null; detail: string } {
  if (/\bwhile\s*\(/.test(source)) {
    return { ok: null, detail: t.whileLoop };
  }
  const bounds: number[] = [];
  const forLoopPattern = /for\s*\([^;]*;\s*\w+\s*<\s*(\d+)\s*;[^)]*\)/g;
  let match: RegExpExecArray | null;
  while ((match = forLoopPattern.exec(source))) {
    bounds.push(Number(match[1]));
  }
  if (bounds.length === 0) {
    return { ok: true, detail: t.noLoops };
  }
  const maxBound = Math.max(...bounds);
  if (maxBound > LOOP_ITERATION_BUDGET) {
    return { ok: false, detail: t.tooManyIterations(maxBound, LOOP_ITERATION_BUDGET) };
  }
  return { ok: true, detail: t.maxIterations(maxBound) };
}

/**
 * コードだけを見る静的チェック。投稿(POST /api/works)と AI の提案(POST /api/ai/edit)で共有する。
 * 文言は依頼の言語で(t は lib/i18n の submission)
 */
export function sourceErrors(source: string, t: Dictionary["submission"]): string[] {
  if (!source.trim()) return [t.emptySource];
  const errors: string[] = [];
  const bytes = byteLength(source);
  if (bytes > SIZE_BUDGET_BYTES) errors.push(t.tooLarge(SIZE_BUDGET_BYTES, bytes));
  if (!hasRenderSignature(source)) errors.push(t.noRender);
  if (source.includes("gl_FragCoord")) errors.push(t.noFragCoord);
  const loops = checkLoopsBounded(source, t);
  if (loops.ok !== true) errors.push(t.loopsUnchecked(loops.detail));
  return errors;
}

/** POST /api/works の本文 */
export interface SubmissionInput {
  title: string;
  source: string;
  license: string;
  /** 未指定は既存の挙動と同じ public */
  visibility?: WorkVisibility;
  /** 表示名(自己申告)。空なら Anonymous */
  author?: string;
  description?: string;
  /** カンマ区切りの文字列でも配列でもよい */
  tags?: string | string[];
}

/** 検証・正規化済みの投稿 */
export interface Submission {
  title: string;
  source: string;
  license: LicenseId;
  visibility: WorkVisibility;
  author: string;
  description: string;
  tags: string[];
  bytes: number;
}

export type ValidationResult = { ok: true; value: Submission } | { ok: false; errors: string[] };

export function validateSubmission(input: unknown, t: Dictionary["submission"]): ValidationResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: [t.notObject] };
  }
  const raw = input as Record<string, unknown>;
  const errors: string[] = [];

  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) errors.push(t.titleRequired);
  else if (title.length > TITLE_MAX) errors.push(t.titleTooLong(TITLE_MAX));

  const source = typeof raw.source === "string" ? raw.source : "";
  const bytes = byteLength(source);
  errors.push(...sourceErrors(source, t));

  // 以前の投稿で選べたライセンス(CC0 など)は、新しい投稿では受け付けない
  const license = LICENSES.find((l) => l.id === raw.license && l.selectable)?.id;
  if (!license) errors.push(t.chooseLicense);

  const visibilityInput = raw.visibility;
  const visibility: WorkVisibility = visibilityInput === "private" ? "private" : "public";
  if (visibilityInput !== undefined && visibilityInput !== "public" && visibilityInput !== "private") {
    errors.push(t.chooseVisibility);
  }

  const authorRaw = typeof raw.author === "string" ? raw.author.trim() : "";
  if (authorRaw.length > AUTHOR_MAX) errors.push(t.authorTooLong(AUTHOR_MAX));

  const description = typeof raw.description === "string" ? raw.description.trim() : "";
  if (description.length > DESCRIPTION_MAX) errors.push(t.descriptionTooLong(DESCRIPTION_MAX));

  const tags = normalizeTags(raw.tags);
  if (tags.length > TAGS_MAX) errors.push(t.tooManyTags(TAGS_MAX));
  const badTag = tags.find((tag) => !TAG_PATTERN.test(tag));
  if (badTag !== undefined) errors.push(t.badTag(badTag));

  if (errors.length > 0 || !license) return { ok: false, errors };
  return {
    ok: true,
    value: { title, source, license, visibility, author: authorRaw || "Anonymous", description, tags, bytes },
  };
}

function normalizeTags(value: unknown): string[] {
  const list = typeof value === "string" ? value.split(",") : Array.isArray(value) ? value : [];
  const tags = list
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim().replace(/^#/, "").toLowerCase())
    .filter((t) => t.length > 0);
  return [...new Set(tags)];
}

/** URL 用の短い名前。英数字が残らないタイトル(日本語など)は "work" にする */
export function slugify(title: string): string {
  const base = title
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
  return base || "work";
}
