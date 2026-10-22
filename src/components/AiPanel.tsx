"use client";

import { type KeyboardEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Badge } from "@frost-ui/react/atoms/badge";
import { Button } from "@frost-ui/react/atoms/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@frost-ui/react/organisms/select";
import { SparkleIcon } from "@/components/SparkleIcon";
import { AI_PROMPT_MAX, getAvailableAiModels, requestAiEdit, type AiTurnSummary, type AiUsage } from "@/lib/aiEdit";
import { AI_MODELS, DEFAULT_AI_MODEL_ID, findAiModel, priceTier } from "@/lib/aiModels";
import { diffLines, diffStats } from "@/lib/lineDiff";
import { byteLength, SIZE_BUDGET_BYTES } from "@/lib/submission";

// 仕様: Figma "Shader / Desktop 1440 — Community + AI"(node 83:443)> AI Composer
// /edit の左下に置く AI パネル。依頼を送ると返答が流れてきて、コードの提案があれば親に渡す
// (エディタの差分表示とプレビューの切り替えは親が持つ)。適用・却下もここから親に伝える。
// 高さはコード欄の 45% まで。超えたら会話だけがスクロールし、見出しと入力欄は動かない。
// 送信ボタンの左でモデルを選べる(lib/aiModels)。選んだモデルはこのブラウザに覚えておく。
// メニューに出すのは、サーバーでいま使えるモデルだけ(Claude の 5 系は Claude Platform on AWS の設定が済んでから)。
// 返答の下に、答えたモデルと使ったトークンの数を出す。

type Turn = {
  id: number;
  prompt: string;
  status: "streaming" | "done" | "error";
  reply: string;
  /** 提案されたコード。提案の無い返答(質問への回答など)なら null */
  source: string | null;
  /** 静的チェック(サイズ・gl_FragCoord・ループ)で見つかった問題 */
  errors: string[];
  /** 依頼したときの土台との差分の行数 */
  stats: { added: number; removed: number } | null;
  applied: boolean;
  /** 答えたモデルと使ったトークンの数(わかれば) */
  model: string | null;
  usage: AiUsage | null;
};

const MODEL_KEY = "shaders-art:ai-model";
const modelListeners = new Set<() => void>();

function subscribeModel(listener: () => void): () => void {
  modelListeners.add(listener);
  // ほかのタブで選び直したときも合わせる
  window.addEventListener("storage", listener);
  return () => {
    modelListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readModel(): string {
  try {
    const stored = localStorage.getItem(MODEL_KEY);
    // 一覧から外れたモデルを覚えていたら、既定に戻す
    return findAiModel(stored) ? (stored as string) : DEFAULT_AI_MODEL_ID;
  } catch {
    return DEFAULT_AI_MODEL_ID;
  }
}

function writeModel(id: string) {
  try {
    localStorage.setItem(MODEL_KEY, id);
  } catch {
    // プライベートブラウジングなどで覚えられなくても、選び直し自体はできるようにする
  }
  for (const listener of modelListeners) listener();
}

const MODEL_LABELS = Object.fromEntries(AI_MODELS.map((model) => [model.id, model.label]));

// いま選べるモデル。ページの読み込みにつき 1 回だけ問い合わせる
let availableModels: Promise<string[] | null> | null = null;

/** loading: ログイン状態の確認中 / login: ログインが必要 / ready: 使える */
export type AiAccess = "loading" | "login" | "ready";

export function AiPanel({
  baseSource,
  pendingTurnId,
  access,
  onLogin,
  onPropose,
  onApply,
  onReject,
}: {
  /** 依頼の土台にするコード(未適用の提案があればその提案。続けて頼むと提案の上に重ねる) */
  baseSource: string;
  /** 未適用の提案を出しているやりとり。無ければ null */
  pendingTurnId: number | null;
  access: AiAccess;
  onLogin: () => void;
  onPropose: (turnId: number, source: string) => void;
  onApply: () => void;
  onReject: () => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const storedModel = useSyncExternalStore(subscribeModel, readModel, () => DEFAULT_AI_MODEL_ID);
  // サーバーに聞くまでは(聞けなかったときも)Bedrock のモデル(Claude を含む)だけを出す
  const [available, setAvailable] = useState<string[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    availableModels ??= getAvailableAiModels();
    void availableModels.then((ids) => {
      if (!cancelled) setAvailable(ids);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const models = AI_MODELS.filter((m) => (available && available.length > 0 ? available.includes(m.id) : m.via !== "claude"));
  // 覚えていたモデルが今は使えなければ、既定のモデルにする
  const model = models.some((m) => m.id === storedModel) ? storedModel : DEFAULT_AI_MODEL_ID;
  const nextId = useRef(1);
  const abortRef = useRef<AbortController | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const busy = turns.some((t) => t.status === "streaming");

  // 返答が流れてくるたびに最新のやりとりまでスクロールする
  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [turns]);

  // ページを離れたら依頼を止める
  useEffect(() => () => abortRef.current?.abort(), []);

  function updateTurn(id: number, update: (turn: Turn) => Partial<Turn>) {
    setTurns((ts) => ts.map((t) => (t.id === id ? { ...t, ...update(t) } : t)));
  }

  async function send() {
    const prompt = draft.trim();
    if (!prompt || busy || access !== "ready") return;
    const id = nextId.current++;
    const base = baseSource;
    const history: AiTurnSummary[] = turns
      .filter((t) => t.status === "done")
      .map((t) => ({ prompt: t.prompt, reply: t.reply }));
    setTurns((ts) => [
      ...ts,
      { id, prompt, status: "streaming", reply: "", source: null, errors: [], stats: null, applied: false, model, usage: null },
    ]);
    setDraft("");

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await requestAiEdit(
        { source: base, prompt, history, model },
        { signal: controller.signal, onText: (text) => updateTurn(id, (t) => ({ reply: t.reply + text })) },
      );
      if (!result.ok) {
        updateTurn(id, () => ({ status: "error", reply: result.message }));
        return;
      }
      // 何も変わっていない提案は、提案なしとして扱う
      const source = result.source !== null && result.source !== base ? result.source : null;
      updateTurn(id, () => ({
        status: "done",
        reply: result.reply,
        source,
        errors: source === null ? [] : result.errors,
        stats: source === null ? null : diffStats(diffLines(base, source)),
        model: result.model ?? model,
        usage: result.usage,
      }));
      if (source !== null) onPropose(id, source);
    } catch {
      const reply = controller.signal.aborted ? "停止しました" : "通信に失敗しました。もう一度お試しください";
      updateTurn(id, () => ({ status: "error", reply }));
    } finally {
      abortRef.current = null;
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send();
    }
  }

  function apply(id: number) {
    updateTurn(id, () => ({ applied: true }));
    onApply();
  }

  return (
    <section
      aria-label="AI と作る"
      className="flex max-h-[45%] shrink-0 flex-col gap-3 border-t border-border-subtle bg-bg-surface px-6 pb-4 pt-3"
    >
      <div className="flex items-center gap-2">
        <SparkleIcon className="size-4 text-accent-default" />
        <h2 className="text-sm font-medium text-text-primary">AI と作る</h2>
        <Badge variant="accent">Beta</Badge>
      </div>

      <div ref={threadRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        {turns.length === 0 && (
          <p className="text-xs text-text-muted">
            コードをどう変えたいか、日本語で頼めます。提案は差分で確かめてから適用できます。
          </p>
        )}
        {turns.map((turn) => (
          <TurnView
            key={turn.id}
            turn={turn}
            pending={turn.id === pendingTurnId}
            onApply={() => apply(turn.id)}
            onReject={onReject}
          />
        ))}
      </div>

      {access === "login" ? (
        <div className="flex items-center justify-between gap-3 rounded-surface border border-border-subtle bg-bg-raised px-3 py-2.5">
          <span className="text-sm text-text-secondary">AI と作るにはログインが必要です(下書きは残ります)</span>
          <Button variant="secondary" size="sm" onClick={onLogin}>
            ログイン
          </Button>
        </div>
      ) : (
        <form
          className="flex flex-col gap-2 rounded-surface border border-border-default bg-bg-raised px-3 pb-2 pt-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <textarea
            aria-label="AI への依頼"
            rows={2}
            maxLength={AI_PROMPT_MAX}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={access !== "ready"}
            placeholder={
              turns.length === 0 ? "例: リングを 2 重にして、色を夕焼けっぽくして" : "続けて頼む… 例: もっとゆっくり動かして"
            }
            className="resize-none bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
          <div className="flex items-center justify-between gap-2">
            <Select items={MODEL_LABELS} value={model} onValueChange={(value) => value && writeModel(value)} disabled={busy}>
              <SelectTrigger
                aria-label="AI のモデル"
                className="h-7 w-auto gap-1 border-transparent bg-transparent px-1.5 text-xs text-text-secondary hover:text-text-primary"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex flex-col gap-0.5 py-0.5">
                      <span className="flex items-baseline gap-2">
                        <span className="text-sm text-text-primary">{m.label}</span>
                        <span className="font-mono text-[11px] text-text-muted" title="料金の目安">
                          {"$".repeat(priceTier(m))}
                        </span>
                      </span>
                      <span className="text-xs text-text-muted">
                        {m.maker} · {m.note}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {busy ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => abortRef.current?.abort()}>
                停止
              </Button>
            ) : (
              // ⌘↵(Ctrl+↵)でも送れる。画面には出さず、ボタンの説明にだけ書く
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                title="⌘↵ でも送信できます"
                disabled={!draft.trim() || access !== "ready"}
              >
                送信
              </Button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}

function TurnView({
  turn,
  pending,
  onApply,
  onReject,
}: {
  turn: Turn;
  pending: boolean;
  onApply: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="max-w-[85%] self-end whitespace-pre-wrap rounded-surface bg-bg-base px-3 py-2 text-sm text-text-primary">
        {turn.prompt}
      </p>
      <div className="flex flex-col gap-2 rounded-surface border border-border-subtle bg-bg-raised p-3">
        <div className="flex gap-2">
          <SparkleIcon className="mt-[3px] size-4 shrink-0 text-accent-default" />
          <p
            className={`whitespace-pre-wrap text-sm ${
              turn.status === "error" ? "text-danger-solid" : turn.reply ? "text-text-primary" : "text-text-muted"
            }`}
          >
            {turn.reply || (turn.status === "streaming" ? "考えています…" : "")}
          </p>
        </div>
        {turn.status === "done" && turn.model && (
          <p className="pl-6 font-mono text-[11px] text-text-muted">
            {findAiModel(turn.model)?.label ?? turn.model}
            {turn.usage && ` · ${(turn.usage.inputTokens + turn.usage.outputTokens).toLocaleString()} トークン`}
          </p>
        )}
        {turn.source !== null && turn.stats && (
          <>
            <ul className="flex flex-wrap gap-x-3 gap-y-1 pl-6 font-mono text-[11px]">
              {turn.errors.length === 0 ? (
                <li className="text-status-success-solid">
                  ✓ 静的チェック OK · {byteLength(turn.source)} B / {SIZE_BUDGET_BYTES / 1024} KB
                </li>
              ) : (
                turn.errors.map((error) => (
                  <li key={error} className="text-danger-solid">
                    ✕ {error}
                  </li>
                ))
              )}
            </ul>
            <div className="flex items-center gap-2 pl-6">
              <span className="font-mono text-[11px] text-status-success-solid">+{turn.stats.added}</span>
              <span className="font-mono text-[11px] text-status-danger-solid">−{turn.stats.removed}</span>
              <div className="flex-1" />
              {pending ? (
                <>
                  <Button variant="ghost" size="sm" onClick={onReject}>
                    却下
                  </Button>
                  <Button variant="secondary" size="sm" onClick={onApply}>
                    適用
                  </Button>
                </>
              ) : (
                <Badge variant={turn.applied ? "success" : "default"}>{turn.applied ? "適用済み" : "未適用"}</Badge>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
