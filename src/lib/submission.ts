// 投稿のルール。/edit の Pre-publish checks(ブラウザ)と POST /api/works(サーバー)で共有する。
// コンパイル可否とフレーム時間はブラウザでしか測れないので、サーバーが確かめられるのは
// ここにある静的なチェックだけ。閾値は Notion でも「仮置き」扱い。

export const SIZE_BUDGET_BYTES = 4096; // 4 KB
export const FRAME_TIME_BUDGET_MS = 8;
export const LOOP_ITERATION_BUDGET = 64;

export const TITLE_MAX = 60;
export const AUTHOR_MAX = 40;
export const DESCRIPTION_MAX = 280;
export const TAGS_MAX = 5;
const TAG_PATTERN = /^[a-z0-9][a-z0-9-]{0,23}$/;
export type WorkVisibility = "public" | "private";

export const LICENSES = [
  { id: "CC0-1.0", label: "CC0 1.0(パブリックドメイン)" },
  { id: "CC-BY-4.0", label: "CC BY 4.0(クレジット表記)" },
  { id: "CC-BY-NC-SA-4.0", label: "CC BY-NC-SA 4.0(非営利・継承)" },
] as const;
export type LicenseId = (typeof LICENSES)[number]["id"];

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
export function checkLoopsBounded(source: string): { ok: boolean | null; detail: string } {
  if (/\bwhile\s*\(/.test(source)) {
    return { ok: null, detail: "while ループは手動確認が必要" };
  }
  const bounds: number[] = [];
  const forLoopPattern = /for\s*\([^;]*;\s*\w+\s*<\s*(\d+)\s*;[^)]*\)/g;
  let match: RegExpExecArray | null;
  while ((match = forLoopPattern.exec(source))) {
    bounds.push(Number(match[1]));
  }
  if (bounds.length === 0) {
    return { ok: true, detail: "ループなし" };
  }
  const maxBound = Math.max(...bounds);
  if (maxBound > LOOP_ITERATION_BUDGET) {
    return { ok: false, detail: `max ${maxBound} > ${LOOP_ITERATION_BUDGET} iterations` };
  }
  return { ok: true, detail: `max ${maxBound} iterations` };
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

export function validateSubmission(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: ["本文が JSON オブジェクトではありません"] };
  }
  const raw = input as Record<string, unknown>;
  const errors: string[] = [];

  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) errors.push("タイトルを入力してください");
  else if (title.length > TITLE_MAX) errors.push(`タイトルは ${TITLE_MAX} 文字以内にしてください`);

  const source = typeof raw.source === "string" ? raw.source : "";
  const bytes = byteLength(source);
  if (!source.trim()) {
    errors.push("コードが空です");
  } else {
    if (bytes > SIZE_BUDGET_BYTES) errors.push(`コードは ${SIZE_BUDGET_BYTES} バイト以内にしてください(現在 ${bytes})`);
    if (!hasRenderSignature(source)) errors.push("vec4 render(vec2 uv, vec2 p) が見つかりません");
    if (source.includes("gl_FragCoord")) errors.push("gl_FragCoord は使えません");
    const loops = checkLoopsBounded(source);
    if (loops.ok !== true) errors.push(`ループの上限を確認できません: ${loops.detail}`);
  }

  const license = LICENSES.find((l) => l.id === raw.license)?.id;
  if (!license) errors.push("ライセンスを選んでください");

  const visibilityInput = raw.visibility;
  const visibility: WorkVisibility = visibilityInput === "private" ? "private" : "public";
  if (visibilityInput !== undefined && visibilityInput !== "public" && visibilityInput !== "private") {
    errors.push("公開範囲を選んでください");
  }

  const authorRaw = typeof raw.author === "string" ? raw.author.trim() : "";
  if (authorRaw.length > AUTHOR_MAX) errors.push(`名前は ${AUTHOR_MAX} 文字以内にしてください`);

  const description = typeof raw.description === "string" ? raw.description.trim() : "";
  if (description.length > DESCRIPTION_MAX) errors.push(`説明は ${DESCRIPTION_MAX} 文字以内にしてください`);

  const tags = normalizeTags(raw.tags);
  if (tags.length > TAGS_MAX) errors.push(`タグは ${TAGS_MAX} 個までです`);
  const badTag = tags.find((t) => !TAG_PATTERN.test(t));
  if (badTag !== undefined) errors.push(`タグは英小文字・数字・ハイフンで 24 文字以内にしてください: ${badTag}`);

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
