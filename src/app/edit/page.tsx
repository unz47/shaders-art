"use client";

import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Badge } from "@frost-ui/react/atoms/badge";
import { Button } from "@frost-ui/react/atoms/button";
import { Input } from "@frost-ui/react/atoms/input";
import { Label } from "@frost-ui/react/atoms/label";
import { Textarea } from "@frost-ui/react/atoms/textarea";
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@frost-ui/react/organisms/accordion";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@frost-ui/react/organisms/dialog";
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@frost-ui/react/organisms/menu";
import { useToast } from "@frost-ui/react/organisms/toast";
import { AI_PANEL_MIN_HEIGHT_PX, type AiAccess, AiPanel } from "@/components/AiPanel";
import { CodeDiff } from "@/components/CodeDiff";
import { Header } from "@/components/Header";
import { ShaderCodeEditor } from "@/components/ShaderCodeEditor";
import { ShaderEditorPreview, type ShaderEditorStats } from "@/components/ShaderEditorPreview";
import { SparkleIcon } from "@/components/SparkleIcon";
import { SplitHandle } from "@/components/SplitHandle";
import {
  AUTHOR_MAX,
  byteLength,
  checkLoopsBounded,
  DEFAULT_LICENSE,
  DESCRIPTION_MAX,
  findLicense,
  FRAME_TIME_BUDGET_MS,
  type LicenseId,
  SIZE_BUDGET_BYTES,
  TITLE_MAX,
  type WorkVisibility,
} from "@/lib/submission";
import { commit, createHistory, type EditHistory, redo, undo } from "@/lib/editHistory";
import { renderGif } from "@/lib/renderGif";
import { renderStillPng } from "@/lib/renderStill";
import { buildStandaloneHtml, downloadBlob, exportFileName, toShadertoy } from "@/lib/shaderExport";
import { embedSnippet, stageUrlForSource } from "@/lib/stageUrl";
import { useFullscreen } from "@/lib/useFullscreen";
import { diffLines, diffStats } from "@/lib/lineDiff";
import { loginHref, useSession } from "@/lib/useSession";
import { submitWork } from "@/lib/works";

// 仕様: Figma "Edit / Desktop 1440"(node 63:421、エラー状態は 65:429)
// WorkDetail(/s/[slug])と同じ「左にコード・右に描画」の構えだが、こちらは
// コードが編集可能で、Pre-publish checksを常時計算して表示する。
// 静的なチェック(サイズ・gl_FragCoord・ループ)は投稿時にサーバーでも同じルール
// (lib/submission.ts)で確かめる。コンパイルとフレーム時間はブラウザでしか測れない。
// 左下の AI パネルが提案を出している間は、エディタが差分表示に、プレビューとチェックが
// 提案のコードに切り替わる。適用か却下を選ぶまで投稿はできない。

const STARTER_SOURCE = ["vec4 render(vec2 uv, vec2 p) {", "  return vec4(uv, 0.5, 1.0);", "}"].join("\n");

// プリセット: それぞれ違う技法を示す短い出発点。既存の収蔵作品(Plasmaなど)を
// そのまま複製すると紛らわしいので、別に用意した簡易版。
const PRESETS: { id: string; label: string; source: string }[] = [
  { id: "gradient", label: "グラデーション", source: STARTER_SOURCE },
  {
    id: "waves",
    label: "波",
    source: ["vec4 render(vec2 uv, vec2 p) {", "  float v = sin((p.x + time) * 6.0) * 0.5 + 0.5;", "  return vec4(vec3(v), 1.0);", "}"].join(
      "\n",
    ),
  },
  {
    id: "rings",
    label: "リング",
    source: [
      "vec4 render(vec2 uv, vec2 p) {",
      "  float r = length(p);",
      "  float ring = smoothstep(0.05, 0.0, abs(fract(r * 4.0 - time * 0.3) - 0.5) - 0.2);",
      "  return vec4(vec3(ring), 1.0);",
      "}",
    ].join("\n"),
  },
  {
    id: "mouse",
    label: "マウス",
    source: [
      "// uniforms: time, resolution, attention, mouse",
      "vec4 render(vec2 uv, vec2 p) {",
      "  float d = length(p - mouse);",
      "  float glow = smoothstep(0.4, 0.0, d);",
      "  return vec4(vec3(glow), 1.0);",
      "}",
    ].join("\n"),
  },
  {
    id: "kaleidoscope",
    label: "カレイドスコープ",
    source: [
      "vec4 render(vec2 uv, vec2 p) {",
      "  float segments = 8.0;",
      "  float a = atan(p.y, p.x);",
      "  float r = length(p);",
      "  a = abs(mod(a, 6.28318 / segments) - 3.14159 / segments);",
      "  vec2 q = vec2(cos(a), sin(a)) * r;",
      "  float v = sin(q.x * 10.0 - time) * 0.5 + 0.5;",
      "  return vec4(vec3(v), 1.0);",
      "}",
    ].join("\n"),
  },
  {
    id: "domain-warp",
    label: "ドメインワーピング",
    source: [
      "float hash(vec2 p) {",
      "  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);",
      "}",
      "",
      "float noise(vec2 p) {",
      "  vec2 i = floor(p);",
      "  vec2 f = fract(p);",
      "  vec2 u = f * f * (3.0 - 2.0 * f);",
      "  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),",
      "             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);",
      "}",
      "",
      "vec4 render(vec2 uv, vec2 p) {",
      "  vec2 warp = vec2(noise(p + time * 0.1), noise(p + vec2(5.2, 1.3) - time * 0.1));",
      "  float n = noise(p * 2.0 + warp * 2.0);",
      "  return vec4(vec3(n), 1.0);",
      "}",
    ].join("\n"),
  },
  {
    id: "sphere",
    label: "疑似3D球体",
    source: [
      "float sdSphere(vec3 p, float r) {",
      "  return length(p) - r;",
      "}",
      "",
      "vec4 render(vec2 uv, vec2 p) {",
      "  vec3 ro = vec3(0.0, 0.0, -3.0);",
      "  vec3 rd = normalize(vec3(p, 1.5));",
      "  float t = 0.0;",
      "  for (int i = 0; i < 32; i++) {",
      "    float d = sdSphere(ro + rd * t, 1.0);",
      "    if (d < 0.001) break;",
      "    t += d;",
      "    if (t > 10.0) break;",
      "  }",
      "  if (t > 10.0) return vec4(0.02, 0.02, 0.05, 1.0);",
      "  vec3 normal = normalize(ro + rd * t);",
      "  vec3 lightDir = normalize(vec3(cos(time), 1.0, -sin(time)));",
      "  float diff = max(dot(normal, lightDir), 0.0);",
      "  return vec4(vec3(diff), 1.0);",
      "}",
    ].join("\n"),
  },
  {
    id: "fractal",
    label: "フラクタル",
    source: [
      "vec4 render(vec2 uv, vec2 p) {",
      "  vec2 c = p * 1.2 + vec2(-0.5, 0.0);",
      "  vec2 z = vec2(0.0);",
      "  float iter = 0.0;",
      "  for (int i = 0; i < 64; i++) {",
      "    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;",
      "    if (dot(z, z) > 4.0) break;",
      "    iter += 1.0;",
      "  }",
      "  float v = iter / 64.0;",
      "  return vec4(vec3(v), 1.0);",
      "}",
    ].join("\n"),
  },
];

// 下書き(コードとタイトル)はこのブラウザに自動保存する。投稿前のログインで Hosted UI に
// 遷移しても書いたものが消えないように。タイトルは後から足したので別のキーに置く
// (既存の下書きはコードの文字列そのままで保存されている)。
const DRAFT_KEY = "shaders-art:edit-draft";
const TITLE_KEY = "shaders-art:edit-title";
// コード欄とプレビュー欄の境界の位置(右側の幅の割合)。このブラウザでの好みとして覚えておく
const SPLIT_KEY = "shaders-art:edit-split";
const DEFAULT_PREVIEW_RATIO = 0.45;
// コード欄と AI 欄の境界の位置(AI 欄の高さの割合)。動かしていなければ保存しない(AI 欄は中身に合わせた高さ)
const AI_SPLIT_KEY = "shaders-art:edit-ai-split";
// AI 欄を閉じているか。閉じたときだけ保存する
const AI_CLOSED_KEY = "shaders-art:edit-ai-closed";
// 書き出しメニューの PNG の大きさ。壁紙や SNS でよく使うもの
const STILL_SIZES = [
  { label: "1920×1080(横・フル HD)", width: 1920, height: 1080, suffix: "1920x1080" },
  { label: "3840×2160(横・4K)", width: 3840, height: 2160, suffix: "4k" },
  { label: "1080×1920(縦・スマホ壁紙)", width: 1080, height: 1920, suffix: "1080x1920" },
  { label: "1080×1080(正方形・SNS)", width: 1080, height: 1080, suffix: "1080x1080" },
] as const;

// 書き出しメニューの GIF。長さと大きさの組み合わせ(20fps)。大きく長いほどファイルも大きくなる
const GIF_PRESETS = [
  { label: "3 秒・480×270(軽い)", width: 480, height: 270, seconds: 3, suffix: "3s" },
  { label: "5 秒・640×360", width: 640, height: 360, seconds: 5, suffix: "5s" },
  { label: "5 秒・480×480(正方形・SNS)", width: 480, height: 480, seconds: 5, suffix: "5s-square" },
] as const;
const GIF_FPS = 20;

// 境界をどこまで動かせるか(それぞれの欄の最小幅)。プレビューは再生ボタンとバッジの行が
// 折り返さない幅にする
const MIN_CODE_WIDTH_PX = 360;
const MIN_PREVIEW_WIDTH_PX = 360;
// 上下の境界の下限。コード欄の側はタイトルの行とコード数行ぶん
const MIN_CODE_HEIGHT_PX = 200;

function readDraft(): string | null {
  try {
    return localStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
}

// localStorage の変更は購読しない(読むのは最初の 1 回だけ)
function subscribeNothing() {
  return () => {};
}

function writeDraft(source: string | null) {
  try {
    if (source === null) localStorage.removeItem(DRAFT_KEY);
    else localStorage.setItem(DRAFT_KEY, source);
  } catch {
    // プライベートブラウジングなどで使えなくても、編集自体は続けられる
  }
}

function readTitle(): string | null {
  try {
    return localStorage.getItem(TITLE_KEY);
  } catch {
    return null;
  }
}

function readSplit(key: string): number | null {
  try {
    const ratio = Number(localStorage.getItem(key));
    return ratio > 0 && ratio < 1 ? ratio : null;
  } catch {
    return null;
  }
}

function writeSplit(key: string, ratio: number | null) {
  try {
    if (ratio === null) localStorage.removeItem(key);
    else localStorage.setItem(key, String(ratio));
  } catch {
    // 覚えられなくても、大きさは変えられる
  }
}

function readAiClosed(): boolean {
  try {
    return localStorage.getItem(AI_CLOSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeAiClosed(closed: boolean) {
  try {
    if (closed) localStorage.setItem(AI_CLOSED_KEY, "1");
    else localStorage.removeItem(AI_CLOSED_KEY);
  } catch {
    // 覚えられなくても、開け閉めはできる
  }
}

function writeTitle(title: string | null) {
  try {
    if (!title) localStorage.removeItem(TITLE_KEY);
    else localStorage.setItem(TITLE_KEY, title);
  } catch {
    // writeDraft と同じく、保存できなくても編集は続けられる
  }
}

// 投稿ダイアログのライセンスの選択肢。ライセンスの名前ではなく、ほかの人が何をしてよいかで選んでもらう
// (lib/submission の LICENSES のうち、新しい投稿で選べるもの)
const LICENSE_CHOICES: { id: LicenseId; title: string; description: string }[] = [
  {
    id: "shaders-art-standard",
    title: "サイトの中でだけ使ってよい",
    description:
      "見る・配信の背景や埋め込みに使う・サイト内でリミックスする、まで。コードをサイトの外で使うには、あなたの許可が要ります",
  },
  {
    id: "CC-BY-4.0",
    title: "名前を出せば、どこでも自由に使ってよい",
    description: "サイトの外でも、改変や販売を含めて使えます。使う人はあなたの名前を表示します。あとから取り消せません",
  },
];

type SubmitForm = {
  title: string;
  author: string;
  license: string;
  visibility: WorkVisibility;
  tags: string;
  description: string;
};
const EMPTY_FORM: SubmitForm = {
  title: "",
  author: "",
  license: DEFAULT_LICENSE,
  visibility: "public",
  tags: "",
  description: "",
};

export default function EditPage() {
  const [code, setCode] = useState(STARTER_SOURCE);
  // GLSLの再コンパイルはキー入力のたびにやると重いので、入力が少し止まってから反映する
  const [compiledSource, setCompiledSource] = useState(STARTER_SOURCE);
  const [playing, setPlaying] = useState(true);
  const [resetToken, setResetToken] = useState(0);
  const [stats, setStats] = useState<ShaderEditorStats>({ fps: 0, elapsed: 0, frameTimeMs: 0, error: null });
  const [hasRendered, setHasRendered] = useState(false);
  // AI パネルが出している未適用の提案
  const [proposal, setProposal] = useState<{ turnId: number; source: string } | null>(null);
  // 取り消し・やり直しの履歴(lib/editHistory.ts)。手での入力は止まったところで記録する
  const [history, setHistory] = useState(() => createHistory(STARTER_SOURCE));

  const session = useSession();
  const router = useRouter();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [form, setForm] = useState<SubmitForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  // Pre-publish checks は普段は閉じておく(落ちているものは閉じていても見せる)
  const [checksOpen, setChecksOpen] = useState(false);
  // 右側(プレビュー)の幅の割合。境界(SplitHandle)のドラッグで変える
  const [previewRatio, setPreviewRatio] = useState(DEFAULT_PREVIEW_RATIO);
  const columnsRef = useRef<HTMLDivElement>(null);
  // AI 欄の高さの割合。左の欄の上下の境界のドラッグで変える。null なら中身に合わせた高さ
  const [aiPanelRatio, setAiPanelRatio] = useState<number | null>(null);
  const codeColumnRef = useRef<HTMLDivElement>(null);
  // AI 欄を出しているか。閉じている間は左下の FAB で開き、開いている間は AI 欄の見出しのボタンで閉じる
  // (隠すだけなので、閉じても会話は残る)
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const fabRef = useRef<HTMLButtonElement>(null);
  // 閉じるボタンは押すと消えるので、閉じたら FAB にフォーカスを移す(開いたときは AiPanel が入力欄に移す)。
  // 保存していた「閉じた状態」を読み込んだときは移さない
  const aiPanelToggled = useRef(false);
  // プレビューの全画面表示
  const stageRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(stageRef);
  const toast = useToast();
  // マウスがプレビューの上で止まっている(または外にある)間は true。全画面ボタンを隠す
  const [pointerIdle, setPointerIdle] = useState(true);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 保存済みの下書きを復元する。サーバーとハイドレーション時は undefined(localStorage が無い)、
  // その直後のブラウザでの再レンダーで実際の値(無ければ null)になる。
  const savedDraft = useSyncExternalStore<string | null | undefined>(subscribeNothing, readDraft, () => undefined);
  const savedTitle = useSyncExternalStore<string | null | undefined>(subscribeNothing, readTitle, () => undefined);
  const savedSplit = useSyncExternalStore<number | null | undefined>(
    subscribeNothing,
    () => readSplit(SPLIT_KEY),
    () => undefined,
  );
  const savedAiSplit = useSyncExternalStore<number | null | undefined>(
    subscribeNothing,
    () => readSplit(AI_SPLIT_KEY),
    () => undefined,
  );
  const savedAiClosed = useSyncExternalStore<boolean | undefined>(subscribeNothing, readAiClosed, () => undefined);
  const [draftChecked, setDraftChecked] = useState(false);
  if (!draftChecked && savedDraft !== undefined) {
    // レンダー中に 1 回だけ state を合わせる(エフェクトで setState すると描画が二重になる)
    setDraftChecked(true);
    if (savedDraft !== null && savedDraft !== STARTER_SOURCE) {
      setCode(savedDraft);
      setCompiledSource(savedDraft);
      setHistory(createHistory(savedDraft));
    }
    if (savedTitle) setForm((f) => ({ ...f, title: savedTitle }));
    if (savedSplit) setPreviewRatio(savedSplit);
    if (savedAiSplit) setAiPanelRatio(savedAiSplit);
    if (savedAiClosed) setAiPanelOpen(false);
  }

  // マウスがプレビューの上で動いたら全画面ボタン(とカーソル)を出し、2 秒止まったら隠す
  function showStageChrome() {
    setPointerIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setPointerIdle(true), 2000);
  }

  function hideStageChrome() {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    setPointerIdle(true);
  }

  function toggleFullscreen() {
    showStageChrome();
    fullscreen.toggle();
  }

  // 書き出しは、いまプレビューに映っているコード(AI の提案を表示中ならその提案)を対象にする
  async function exportPng(size: (typeof STILL_SIZES)[number]) {
    try {
      // プレビューと同じ時刻のコマを描く
      const blob = await renderStillPng(exportSource, { width: size.width, height: size.height, time: stats.elapsed });
      downloadBlob(blob, exportFileName(form.title, size.suffix, "png"));
    } catch (error) {
      const description = error instanceof Error ? error.message : undefined;
      toast.add({ title: "画像を書き出せませんでした", description, priority: "high" });
    }
  }

  // GIF は数秒かかるので、進み具合を「書き出し」ボタンに出す(書き出し中は押せない)
  const [gifProgress, setGifProgress] = useState<number | null>(null);

  async function exportGif(preset: (typeof GIF_PRESETS)[number]) {
    setGifProgress(0);
    try {
      const blob = await renderGif(exportSource, {
        width: preset.width,
        height: preset.height,
        seconds: preset.seconds,
        fps: GIF_FPS,
        startTime: stats.elapsed,
        onProgress: setGifProgress,
      });
      downloadBlob(blob, exportFileName(form.title, preset.suffix, "gif"));
    } catch (error) {
      const description = error instanceof Error ? error.message : undefined;
      toast.add({ title: "GIF を書き出せませんでした", description, priority: "high" });
    } finally {
      setGifProgress(null);
    }
  }

  function exportHtml() {
    const html = buildStandaloneHtml(exportSource, { title: form.title });
    downloadBlob(new Blob([html], { type: "text/html" }), exportFileName(form.title, "", "html"));
  }

  function copyText(text: string, title: string, description: string) {
    void navigator.clipboard
      .writeText(text)
      .then(() => toast.add({ title, description }))
      .catch(() => toast.add({ title: "コピーできませんでした", priority: "high" }));
  }

  function copyForShadertoy() {
    copyText(toShadertoy(exportSource, { title: form.title }), "コピーしました", "Shadertoy の Image タブに貼り付けてください。");
  }

  function copyStageUrl() {
    if (!stageUrl) return;
    copyText(
      stageUrl,
      "配信背景用の URL をコピーしました",
      "OBS の「ソース」→「ブラウザ」の URL に貼り付け、幅 1920・高さ 1080 にしてください。壁紙アプリにも使えます。",
    );
  }

  function copyEmbed() {
    if (!stageUrl) return;
    copyText(embedSnippet(stageUrl, form.title), "埋め込みコードをコピーしました", "ブログやサイトの HTML に貼り付けてください。");
  }

  useEffect(
    () => () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    },
    [],
  );

  function changePreviewRatio(ratio: number) {
    setPreviewRatio(ratio);
    writeSplit(SPLIT_KEY, ratio);
  }

  function changeAiPanelRatio(ratio: number | null) {
    setAiPanelRatio(ratio);
    writeSplit(AI_SPLIT_KEY, ratio);
  }

  function changeAiPanelOpen(open: boolean) {
    aiPanelToggled.current = true;
    setAiPanelOpen(open);
    writeAiClosed(!open);
  }

  useEffect(() => {
    if (!aiPanelToggled.current) return;
    aiPanelToggled.current = false;
    if (!aiPanelOpen) fabRef.current?.focus();
  }, [aiPanelOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCompiledSource(code);
      writeDraft(code);
      setHistory((h) => commit(h, code));
    }, 400);
    return () => clearTimeout(timer);
  }, [code]);

  const handleStats = useCallback((next: ShaderEditorStats) => {
    setStats(next);
    setHasRendered(true);
  }, []);

  function handleReset() {
    applySource(STARTER_SOURCE);
  }

  function applySource(source: string) {
    // 差し替え(プリセット・リセット・AI の提案の適用)は 1 段として記録する。
    // まだ記録していない手での入力があれば、先にそれを 1 段にしておく
    setHistory((h) => commit(commit(h, code), source));
    setCode(source);
    setCompiledSource(source);
    setProposal(null);
    setHasRendered(false);
    setResetToken((t) => t + 1);
  }

  // 入力が止まる前(まだ記録していない分)があれば、それも 1 段として扱う
  const canUndo = proposal === null && (history.past.length > 0 || code !== history.present);
  const canRedo = proposal === null && history.future.length > 0 && code === history.present;

  function moveHistory(next: EditHistory) {
    setHistory(next);
    setCode(next.present);
    setCompiledSource(next.present);
    setHasRendered(false);
  }

  function handleUndo() {
    if (canUndo) moveHistory(undo(commit(history, code)));
  }

  function handleRedo() {
    if (canRedo) moveHistory(redo(history));
  }

  function handlePropose(turnId: number, source: string) {
    setProposal({ turnId, source });
    setHasRendered(false);
  }

  function handleApplyProposal() {
    if (proposal) applySource(proposal.source);
  }

  function handleRejectProposal() {
    setProposal(null);
    setHasRendered(false);
  }

  // 提案があれば、プレビューとチェックはその提案のコードを見る
  const checkedSource = proposal?.source ?? code;
  // プレビューに映っているコード(書き出しの対象)。コンパイルできているときだけ書き出せる
  const exportSource = proposal?.source ?? compiledSource;
  const canExport = hasRendered && stats.error === null;
  // 配信背景・埋め込み用の URL(コードを圧縮して # に入れる)。圧縮は非同期なので、コピーの
  // クリックの時点で作っていると、ブラウザによってはクリップボードへの書き込みを断られる。先に作っておく
  const [stageUrl, setStageUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void stageUrlForSource(window.location.origin, exportSource).then((url) => {
      if (!cancelled) setStageUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [exportSource]);
  const diff = useMemo(() => (proposal ? diffLines(code, proposal.source) : null), [code, proposal]);
  const diffCount = diff ? diffStats(diff) : null;

  const bytes = byteLength(checkedSource);
  const hasFragCoord = checkedSource.includes("gl_FragCoord");
  const loopCheck = checkLoopsBounded(checkedSource);

  const checks: PrePublishCheck[] = [
    {
      key: "compiles",
      label: "Compiles",
      ok: hasRendered ? stats.error === null : null,
      detail: !hasRendered ? "確認中…" : (stats.error ?? "WebGL2 · GLSL ES 3.00"),
    },
    {
      key: "size",
      label: "Size",
      ok: bytes <= SIZE_BUDGET_BYTES,
      detail: `${bytes} B / ${SIZE_BUDGET_BYTES / 1024} KB`,
    },
    {
      key: "frame-time",
      label: "Frame time",
      ok: hasRendered ? stats.frameTimeMs <= FRAME_TIME_BUDGET_MS : null,
      detail: hasRendered ? `${stats.frameTimeMs.toFixed(1)} ms / ${FRAME_TIME_BUDGET_MS} ms budget` : "確認中…",
    },
    {
      key: "no-fragcoord",
      label: "No gl_FragCoord",
      ok: !hasFragCoord,
      detail: hasFragCoord ? "gl_FragCoord は使えません" : "render(uv, p) only",
    },
    {
      key: "loops",
      label: "Loops bounded",
      ok: loopCheck.ok,
      detail: loopCheck.detail,
    },
  ];
  const passedCount = checks.filter((c) => c.ok === true).length;
  const failedChecks = checks.filter((c) => c.ok === false);
  const allPassed = passedCount === checks.length;
  // 入力直後はプレビューがまだ古いコードの結果なので、反映されるまで投稿させない
  const upToDate = code === compiledSource;
  const authReady = session.status === "ready" && session.configured;
  const loggedIn = session.status === "ready" && session.user !== null;
  const canProceed = allPassed && upToDate && authReady && proposal === null;
  // AI はログイン必須。ログインの設定が無い環境(Cognito を繋いでいないローカルやモック)では
  // 使える扱いにして、可否はサーバー(またはモック)の応答に任せる
  const aiAccess: AiAccess = session.status !== "ready" ? "loading" : session.configured && !loggedIn ? "login" : "ready";

  function goToLogin() {
    writeDraft(code);
    window.location.assign(loginHref("/edit"));
  }

  function handleProceed() {
    if (!loggedIn) {
      goToLogin();
      return;
    }
    setSubmitErrors([]);
    setSubmitOpen(true);
  }

  function updateForm<K extends keyof SubmitForm>(key: K, value: SubmitForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // タイトルはエディタの上と投稿ダイアログのどちらからでも変えられ、下書きと一緒に保存する
  function updateTitle(title: string) {
    updateForm("title", title);
    writeTitle(title);
  }

  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitErrors([]);
    try {
      const result = await submitWork({ ...form, source: code });
      if (result.ok) {
        writeDraft(null);
        writeTitle(null);
        router.push(`/s/${result.slug}`);
        return;
      }
      // セッションが切れていたら、下書きを残したままログインし直してもらう
      if (result.status === 401) {
        goToLogin();
        return;
      }
      setSubmitErrors(result.errors);
    } catch {
      setSubmitErrors(["通信に失敗しました。もう一度お試しください"]);
    }
    setSubmitting(false);
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header showSearch={false} />
      <div ref={columnsRef} className="flex flex-1 overflow-hidden">
        {/* 左: コード(編集可能) */}
        <div ref={codeColumnRef} className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border-subtle px-6 py-3">
            <div className="min-w-0 flex-1">
              {/* その場で編集できるタイトル。投稿ダイアログのタイトル欄と同じ値 */}
              <input
                aria-label="作品のタイトル"
                value={form.title}
                onChange={(e) => updateTitle(e.target.value)}
                placeholder="Untitled"
                maxLength={TITLE_MAX}
                className="-mx-1 w-full truncate rounded-control bg-transparent px-1 text-sm font-medium text-text-primary outline-none placeholder:text-text-muted hover:bg-bg-raised focus:bg-bg-raised"
              />
              <p className="text-xs tracking-wide text-text-secondary">下書き · このブラウザに自動保存</p>
            </div>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="px-sp-xs"
                aria-label="元に戻す"
                title="元に戻す(⌘Z)"
                disabled={!canUndo}
                onClick={handleUndo}
              >
                <UndoIcon />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="px-sp-xs"
                aria-label="やり直す"
                title="やり直す(⇧⌘Z)"
                disabled={!canRedo}
                onClick={handleRedo}
              >
                <UndoIcon className="-scale-x-100" />
              </Button>
            </div>
            <Menu>
              <MenuTrigger render={<Button variant="secondary" size="sm" />}>プリセット</MenuTrigger>
              <MenuContent align="end">
                {PRESETS.map((preset) => (
                  <MenuItem key={preset.id} onClick={() => applySource(preset.source)}>
                    {preset.label}
                  </MenuItem>
                ))}
              </MenuContent>
            </Menu>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              リセット
            </Button>
          </div>
          {/* ファイル名と render のヒントのバーは置かない(作品は 1 ファイルだけなので)。
              AI の提案を差分で見せている間だけ、その旨を出す */}
          {diffCount && (
            <div className="flex items-center gap-1.5 border-b border-border-subtle px-6 py-2 font-mono text-[11px] text-text-muted">
              AI の提案を表示中
              <span className="text-status-success-solid">+{diffCount.added}</span>
              <span className="text-status-danger-solid">−{diffCount.removed}</span>
              (未適用)
            </div>
          )}
          {diff ? (
            <CodeDiff lines={diff} />
          ) : (
            <ShaderCodeEditor value={code} onChange={setCode} onUndo={handleUndo} onRedo={handleRedo} />
          )}
          {aiPanelOpen && (
            <SplitHandle
              containerRef={codeColumnRef}
              orientation="horizontal"
              label="コード欄と AI 欄の境界"
              ratio={aiPanelRatio}
              minStartPx={MIN_CODE_HEIGHT_PX}
              minEndPx={AI_PANEL_MIN_HEIGHT_PX}
              onChange={changeAiPanelRatio}
              onReset={() => changeAiPanelRatio(null)}
            />
          )}
          {/* 閉じている間に未適用の提案があれば、気づけるよう印を付ける */}
          {!aiPanelOpen && (
            <Button
              ref={fabRef}
              size="icon"
              className="absolute bottom-6 left-6 z-20 size-12 rounded-full shadow-elevation-2"
              aria-label={proposal ? "AI 欄を開く(未適用の提案があります)" : "AI 欄を開く"}
              title={proposal ? "AI と作る(未適用の提案があります)" : "AI と作る"}
              onClick={() => changeAiPanelOpen(true)}
            >
              <SparkleIcon className="size-5" />
              {proposal && (
                <span
                  aria-hidden="true"
                  className="absolute -right-0.5 -top-0.5 size-3.5 rounded-full bg-status-warning-solid ring-2 ring-bg-base"
                />
              )}
            </Button>
          )}
          <AiPanel
            open={aiPanelOpen}
            onClose={() => changeAiPanelOpen(false)}
            baseSource={checkedSource}
            pendingTurnId={proposal?.turnId ?? null}
            access={aiAccess}
            heightRatio={aiPanelRatio}
            onLogin={goToLogin}
            onPropose={handlePropose}
            onApply={handleApplyProposal}
            onReject={handleRejectProposal}
          />
        </div>

        <SplitHandle
          containerRef={columnsRef}
          label="コード欄とプレビュー欄の境界"
          ratio={previewRatio}
          minStartPx={MIN_CODE_WIDTH_PX}
          minEndPx={MIN_PREVIEW_WIDTH_PX}
          onChange={changePreviewRatio}
          onReset={() => changePreviewRatio(DEFAULT_PREVIEW_RATIO)}
        />

        {/* 右: ステージ(ライブプレビュー + 審査チェック)。幅は境界のドラッグで変わる */}
        <div
          className="flex shrink-0 flex-col gap-4 overflow-auto p-4"
          style={{ width: `${previewRatio * 100}%`, minWidth: MIN_PREVIEW_WIDTH_PX }}
        >
          {/* 全画面にするのはこの枠。YouTube などと同じく右下のボタン(またはダブルクリック)で
              切り替える。ボタンはマウスが動いている間だけ出し、2 秒止まったら隠す。
              全画面の間はカーソルも隠して作品だけを見せる */}
          <div
            ref={stageRef}
            onPointerMove={showStageChrome}
            onPointerLeave={hideStageChrome}
            onDoubleClick={toggleFullscreen}
            className={`relative min-h-0 flex-1 overflow-hidden rounded-surface border border-border-subtle [&:fullscreen]:rounded-none [&:fullscreen]:border-0 ${
              fullscreen.active && pointerIdle ? "cursor-none" : ""
            }`}
          >
            <ShaderEditorPreview
              source={proposal?.source ?? compiledSource}
              playing={playing}
              attention={0}
              resetToken={resetToken}
              onStats={handleStats}
            />
            {fullscreen.supported && (
              <button
                type="button"
                aria-label={fullscreen.active ? "全画面を終了" : "全画面"}
                title={`${fullscreen.active ? "全画面を終了" : "全画面"}(ダブルクリックでも切り替え)`}
                onClick={toggleFullscreen}
                onDoubleClick={(e) => e.stopPropagation()}
                // 作品の上に重ねるので、テーマに関わらず半透明の黒地に白いアイコンにする
                className={`absolute bottom-3 right-3 z-10 grid size-8 place-items-center rounded-control bg-black/50 text-white transition-opacity hover:bg-black/70 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-white ${
                  pointerIdle ? "pointer-events-none opacity-0" : "opacity-100"
                }`}
              >
                <FullscreenIcon exit={fullscreen.active} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPlaying((p) => !p)}>
              {playing ? "一時停止" : "再生"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setResetToken((t) => t + 1)}>
              先頭へ
            </Button>
            <Menu>
              <MenuTrigger render={<Button variant="ghost" size="sm" disabled={!canExport || gifProgress !== null} />}>
                {gifProgress === null ? "書き出し" : `GIF を作成中 ${Math.round(gifProgress * 100)}%`}
              </MenuTrigger>
              <MenuContent align="start">
                <MenuGroup>
                  <MenuGroupLabel>画像(PNG・いまのコマ)</MenuGroupLabel>
                  {STILL_SIZES.map((size) => (
                    <MenuItem key={size.suffix} onClick={() => void exportPng(size)}>
                      {size.label}
                    </MenuItem>
                  ))}
                </MenuGroup>
                <MenuSeparator />
                <MenuGroup>
                  <MenuGroupLabel>GIF(ループ・いまのコマから)</MenuGroupLabel>
                  {GIF_PRESETS.map((preset) => (
                    <MenuItem key={preset.suffix} onClick={() => void exportGif(preset)}>
                      {preset.label}
                    </MenuItem>
                  ))}
                </MenuGroup>
                <MenuSeparator />
                <MenuGroup>
                  <MenuGroupLabel>コード</MenuGroupLabel>
                  <MenuItem onClick={exportHtml}>単体で動く HTML ファイル</MenuItem>
                  <MenuItem onClick={copyForShadertoy}>Shadertoy 用にコピー</MenuItem>
                </MenuGroup>
                <MenuSeparator />
                <MenuGroup>
                  <MenuGroupLabel>配信背景・埋め込み(投稿しなくても使える)</MenuGroupLabel>
                  <MenuItem disabled={!stageUrl} onClick={copyStageUrl}>
                    配信背景用の URL をコピー
                  </MenuItem>
                  <MenuItem disabled={!stageUrl} onClick={copyEmbed}>
                    埋め込みコードをコピー
                  </MenuItem>
                </MenuGroup>
              </MenuContent>
            </Menu>
            <div className="flex-1" />
            <Badge>{bytes} bytes</Badge>
            <Badge>{stats.fps} fps</Badge>
            <Badge>{stats.elapsed.toFixed(1)} s</Badge>
          </div>

          {/* 普段は閉じておき、通過数だけ見せる。落ちているチェックは閉じていてもその行だけ出す。
              見出しを押すと全部開く */}
          <Accordion
            className="rounded-surface border border-border-subtle"
            value={checksOpen ? ["checks"] : []}
            onValueChange={(value) => setChecksOpen(value.includes("checks"))}
          >
            <AccordionItem value="checks" className="border-t-0">
              <AccordionTrigger className="px-4 py-3">
                <span className="flex-1">Pre-publish checks</span>
                <span className={`text-xs font-normal ${allPassed ? "text-text-muted" : "text-danger-solid"}`}>
                  {passedCount} / {checks.length} passed
                </span>
              </AccordionTrigger>
              {!checksOpen && failedChecks.length > 0 && (
                <div className="flex flex-col border-t border-border-subtle">
                  {failedChecks.map((c) => (
                    <CheckRow key={c.key} check={c} />
                  ))}
                </div>
              )}
              <AccordionPanel>
                <div className="flex flex-col border-t border-border-subtle">
                  {checks.map((c) => (
                    <CheckRow key={c.key} check={c} />
                  ))}
                </div>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

          {/* 投稿はチェックのすぐ下に置く(画面下の全幅バーはやめ、左はコードと AI、右は確認と投稿に分ける) */}
          <div className="flex items-center justify-end gap-4">
            {proposal && <span className="flex-1 text-xs text-text-muted">AI の提案を適用するか却下すると投稿できます</span>}
            {!proposal && authReady && !loggedIn && (
              <span className="flex-1 text-xs text-text-muted">投稿にはログインが必要です(下書きは残ります)</span>
            )}
            <Button variant="primary" size="md" disabled={!canProceed} onClick={handleProceed}>
              {loggedIn || !authReady ? "Submitへ進む" : "ログインして投稿"}
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={submitOpen}
        onOpenChange={(open) => {
          if (!submitting) setSubmitOpen(open);
        }}
      >
        <DialogContent className="w-full max-w-md">
          <DialogTitle>作品を登録する</DialogTitle>
          <DialogDescription>
            {form.visibility === "public"
              ? "作品ページは誰でも閲覧でき、Gallery に表示されます。"
              : "作品ページは投稿者本人だけが閲覧できます。Gallery にも表示されません。"}
          </DialogDescription>
          <form onSubmit={handlePublish} className="mt-4 flex flex-col gap-3">
            <Field label="タイトル" htmlFor="submit-title">
              <Input
                id="submit-title"
                required
                maxLength={TITLE_MAX}
                value={form.title}
                onChange={(e) => updateTitle(e.target.value)}
              />
            </Field>
            <Field label="名前(表示用・任意)" htmlFor="submit-author">
              <Input
                id="submit-author"
                placeholder="Anonymous"
                maxLength={AUTHOR_MAX}
                value={form.author}
                onChange={(e) => updateForm("author", e.target.value)}
              />
            </Field>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 flex w-full items-baseline text-sm font-medium text-text-primary">
                <span className="flex-1">ほかの人の使い方</span>
                {/* ダイアログを閉じずに読めるよう別のタブで開く(下書きは残る) */}
                <a
                  href="/terms#license"
                  target="_blank"
                  rel="noopener"
                  className="text-xs font-normal text-text-secondary underline underline-offset-2 hover:text-text-primary"
                >
                  ライセンスについて
                </a>
              </legend>
              {LICENSE_CHOICES.map((choice) => (
                <label
                  key={choice.id}
                  className="flex cursor-pointer items-start gap-3 rounded-control border border-border-subtle p-3"
                >
                  <input
                    className="mt-1 accent-accent-default"
                    type="radio"
                    name="license"
                    value={choice.id}
                    checked={form.license === choice.id}
                    onChange={() => updateForm("license", choice.id)}
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm text-text-primary">{choice.title}</span>
                    <span className="text-xs text-text-muted">{choice.description}</span>
                    <span className="font-mono text-[11px] text-text-muted">{findLicense(choice.id)?.label}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium text-text-primary">公開範囲</legend>
              <label className="flex cursor-pointer items-start gap-3 rounded-control border border-border-subtle p-3">
                <input
                  className="mt-1 accent-accent-default"
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={form.visibility === "public"}
                  onChange={() => updateForm("visibility", "public")}
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm text-text-primary">公開</span>
                  <span className="text-xs text-text-muted">作品ページが Gallery に表示され、誰でも閲覧できます</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-control border border-border-subtle p-3">
                <input
                  className="mt-1 accent-accent-default"
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={form.visibility === "private"}
                  onChange={() => updateForm("visibility", "private")}
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm text-text-primary">非公開</span>
                  <span className="text-xs text-text-muted">投稿者本人だけが閲覧できます</span>
                </span>
              </label>
            </fieldset>
            <Field label="タグ(カンマ区切り・任意)" htmlFor="submit-tags">
              <Input
                id="submit-tags"
                placeholder="noise, warp"
                value={form.tags}
                onChange={(e) => updateForm("tags", e.target.value)}
              />
            </Field>
            <Field label="説明(任意)" htmlFor="submit-description">
              <Textarea
                id="submit-description"
                rows={3}
                maxLength={DESCRIPTION_MAX}
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
              />
            </Field>
            {submitErrors.length > 0 && (
              <ul className="flex flex-col gap-1 text-xs text-danger-solid">
                {submitErrors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}
            <div className="mt-2 flex justify-end gap-2">
              <DialogClose render={<Button type="button" variant="ghost" size="sm" disabled={submitting} />}>
                キャンセル
              </DialogClose>
              <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                {submitting ? "登録中…" : form.visibility === "public" ? "公開する" : "非公開で登録"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 全画面に入る(四隅が外向き)/ 抜ける(四隅が内向き)。色は文字色に従う
function FullscreenIcon({ exit }: { exit: boolean }) {
  const d = exit
    ? "M6 2.5v3.5H2.5M10 2.5v3.5h3.5M6 13.5V10H2.5M10 13.5V10h3.5"
    : "M2.5 6V2.5H6M13.5 6V2.5H10M2.5 10v3.5H6M13.5 10v3.5H10";
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-4">
      <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ↶(左右反転すると ↷ になる)。色は文字色に従う
function UndoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={`size-4 ${className ?? ""}`}>
      <path
        d="M6 3.5 3 6.5l3 3M3 6.5h6.5a3.5 3.5 0 0 1 0 7H8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type PrePublishCheck = { key: string; label: string; ok: boolean | null; detail: string };

function CheckRow({ check }: { check: PrePublishCheck }) {
  const failed = check.ok === false;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 text-sm">
      <span
        className={`w-4 shrink-0 text-center ${
          check.ok === null ? "text-text-muted" : check.ok ? "text-accent-default" : "text-danger-solid"
        }`}
      >
        {check.ok === null ? "…" : check.ok ? "✓" : "✕"}
      </span>
      <span className={`flex-1 ${failed ? "text-danger-solid" : "text-text-primary"}`}>{check.label}</span>
      <span className={`font-mono text-xs ${failed ? "text-danger-solid" : "text-text-muted"}`}>{check.detail}</span>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
