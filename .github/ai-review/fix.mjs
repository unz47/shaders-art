// レビューの指摘を直す Claude を Agent SDK で 1 回動かし、結果を fix-input/result.json に書く。
//
// 作業ルート(main のチェックアウト)で実行する。直す対象の PR は pr-head/ にある前提。
// Claude の作業ディレクトリは pr-head/ だけにする。指示書やこのスクリプトは main 側にあり、
// Claude からは読めも書けもしない(書き換えられると、あとのステップで実行されてしまうため)。
// 指示書・PR の説明・レビューのコメントは、プロンプトに埋め込んで渡す。
//
// このスクリプトはコミットも push もしない。失敗しても exit 0 で終わり、続きはワークフローが決める。
// 環境変数: ANTHROPIC_API_KEY、FIX_MODEL、FIX_MAX_USD(1 回の上限)
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { pathGuard } from "./guard.mjs";

const here = new URL(".", import.meta.url);
const read = (path) => readFileSync(path, "utf8");
const model = process.env.FIX_MODEL;
const maxBudgetUsd = Number(process.env.FIX_MAX_USD) || undefined;
const cwd = resolve("pr-head");

const schema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    fixed: { type: "array", items: { type: "string" } },
    not_fixed: {
      type: "array",
      items: {
        type: "object",
        properties: { finding: { type: "string" }, reason: { type: "string" } },
        required: ["finding", "reason"],
      },
    },
  },
  required: ["summary", "fixed", "not_fixed"],
};

const prompt = [
  read(new URL("fix-prompt.md", here)),
  "<pr>",
  read("fix-input/pr.md"),
  "</pr>",
  "<review>",
  read("fix-input/review.md"),
  "</review>",
].join("\n");

const out = { model, structured: null, cost_usd: null, turns: null, error: null };

try {
  const run = query({
    prompt,
    options: {
      cwd,
      model,
      maxBudgetUsd,
      tools: ["Read", "Grep", "Glob", "Edit", "Write"],
      // 作業ディレクトリ内の編集は確認なしで通す。場所の制限は下のフックが受け持つ。
      permissionMode: "acceptEdits",
      hooks: { PreToolUse: [{ hooks: [pathGuard({ cwd, readRoots: [cwd], writeRoots: [cwd] })] }] },
      mcpServers: {},
      strictMcpConfig: true,
      // PR 側が置いた設定や指示ファイルを自動では読み込ませない。
      settingSources: [],
      systemPrompt: { type: "preset", preset: "claude_code" },
      outputFormat: { type: "json_schema", schema },
    },
  });

  for await (const message of run) {
    if (message.type === "assistant") {
      for (const block of message.message.content) {
        if (block.type === "tool_use" && block.name !== "StructuredOutput") {
          console.log(`${block.name} ${block.input.file_path ?? block.input.pattern ?? ""}`);
        }
      }
    }
    if (message.type === "result") {
      out.cost_usd = message.total_cost_usd ?? null;
      out.turns = message.num_turns ?? null;
      console.log(`usage=${JSON.stringify(message.modelUsage ?? message.usage ?? {})}`);
      if (message.subtype === "success" && !message.is_error && message.structured_output) {
        out.structured = message.structured_output;
      } else {
        out.error = [message.is_error ? "api_error" : message.subtype, message.result, ...(message.errors ?? [])]
          .filter(Boolean)
          .join(": ")
          .replace(/\s+/g, " ")
          .slice(0, 300);
      }
    }
  }
} catch (error) {
  out.error ??= String(error);
}

writeFileSync("fix-input/result.json", JSON.stringify(out, null, 2));
console.log(`model=${out.model} turns=${out.turns} cost_usd=${out.cost_usd} error=${out.error ?? "-"}`);
