// /edit のコードの取り消し・やり直し(Undo / Redo)の履歴。
// テキストエリア標準の ⌘Z では、AI の提案の適用・プリセット・リセットのように、コードを
// 丸ごと差し替えた変更を戻せない。なのでアプリ側でコードのスナップショットを持つ。
// 手での入力は、入力が止まったところで 1 段として記録する(/edit の 400ms の待ちと同じ区切り)。

/** 戻れる段数。作品は数 KB なので、この程度なら持っていても軽い */
export const HISTORY_LIMIT = 100;

export interface EditHistory {
  past: string[];
  present: string;
  future: string[];
}

export function createHistory(present: string): EditHistory {
  return { past: [], present, future: [] };
}

/** 新しい状態を記録する。今と同じなら何もしない。記録したら、やり直しの履歴は捨てる */
export function commit(history: EditHistory, next: string): EditHistory {
  if (next === history.present) return history;
  return { past: [...history.past, history.present].slice(-HISTORY_LIMIT), present: next, future: [] };
}

export function undo(history: EditHistory): EditHistory {
  const previous = history.past.at(-1);
  if (previous === undefined) return history;
  return { past: history.past.slice(0, -1), present: previous, future: [history.present, ...history.future] };
}

export function redo(history: EditHistory): EditHistory {
  const [next, ...rest] = history.future;
  if (next === undefined) return history;
  return { past: [...history.past, history.present], present: next, future: rest };
}
