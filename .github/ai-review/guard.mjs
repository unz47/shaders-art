// Claude が道具を使う直前に割り込み、読み書きしてよい場所の外なら拒否する PreToolUse フック。
//
// 権限モードの判定だけに任せないのは、PR がシンボリックリンク(例: pr-head/x -> /proc/self/environ)
// を置いた場合でも確実に止めるため。ここではリンクを実体まで解決してから場所を判定する。
// .git の中は読み書きとも拒否する(.git/hooks に書かれると、あとの git commit / push で実行されてしまう)。
import { lstatSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, resolve, sep } from "node:path";

const WRITE_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);

// これから作るファイルのように実体が無いパスは、存在するいちばん近い親を解決してつなぐ。
// リンクそのものはあるのに先が無い(壊れたリンク)場合は、書き込みで外に出られるので null を返す。
function realPath(path) {
  const rest = [];
  let cur = path;
  for (;;) {
    let exists = true;
    try {
      lstatSync(cur);
    } catch {
      exists = false;
    }
    if (exists) {
      try {
        return resolve(realpathSync(cur), ...rest);
      } catch {
        return null;
      }
    }
    const up = dirname(cur);
    if (up === cur) return null;
    rest.unshift(basename(cur));
    cur = up;
  }
}

const within = (path, roots) => roots.some((root) => path === root || path.startsWith(root + sep));

// Glob / Grep のパターンで外を探しに行けないようにする。
const escapesPattern = (pattern) =>
  typeof pattern === "string" && (isAbsolute(pattern) || pattern.startsWith("~") || pattern.split(/[\\/]/).includes(".."));

/**
 * @param {{ cwd: string, readRoots: string[], writeRoots: string[] }} options
 */
export function pathGuard({ cwd, readRoots, writeRoots }) {
  const reads = readRoots.map((root) => realpathSync(root));
  const writes = writeRoots.map((root) => realpathSync(root));

  const deny = (reason) => ({
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason },
  });

  return async (input) => {
    if (input.hook_event_name !== "PreToolUse") return {};
    const tool = input.tool_name;
    const args = input.tool_input ?? {};

    if (tool === "Glob" && escapesPattern(args.pattern)) return deny(`パターン ${args.pattern} は使えません`);
    if (tool === "Grep" && escapesPattern(args.glob)) return deny(`パターン ${args.glob} は使えません`);

    const raw = args.file_path ?? args.notebook_path ?? args.path ?? ".";
    // 道具の側が ~ をホームに展開するかもしれないので、ここでは解決せずに拒否する。
    if (typeof raw !== "string" || raw.startsWith("~")) return deny(`${raw} は使えないパスです`);
    const path = realPath(resolve(cwd, raw));
    const write = WRITE_TOOLS.has(tool);
    const allowed = path !== null && within(path, write ? writes : reads) && !path.split(sep).includes(".git");
    if (allowed) return {};
    return deny(`${raw} は${write ? "書き換え" : "読み取り"}できない場所です`);
  };
}
