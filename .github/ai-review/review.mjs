// レビュー役の Claude を Agent SDK で 1 回動かし、結果を review-input/result.json に書く。
//
// claude-code-action ではなく Agent SDK を直接使うのは、Max プランに付く月次の API クレジットが
// Agent SDK を対象にし、Claude Code を対象にしないため。
//
// このスクリプトは判定をしない。失敗しても exit 0 で終わり、通すか落とすかは gate.sh が決める
// (result.json に structured が無ければ gate.sh が落とす)。
//
// 作業ルート(マージ先のチェックアウト)で実行する。PR 側は pr-head/ にある前提。
// 環境変数: ANTHROPIC_API_KEY、REVIEW_MODEL、REVIEW_MAX_USD(1 回の上限。超えそうなら打ち切る)
import { readFileSync, writeFileSync } from "node:fs";
import { query } from "@anthropic-ai/claude-agent-sdk";

const here = new URL(".", import.meta.url);
const schema = JSON.parse(readFileSync(new URL("schema.json", here), "utf8"));
const model = process.env.REVIEW_MODEL;
const maxBudgetUsd = Number(process.env.REVIEW_MAX_USD) || undefined;

const out = { model, structured: null, cost_usd: null, turns: null, error: null };


try {
  const run = query({
    prompt:
      ".github/ai-review/prompt.md を読み、そこに書かれた指示に従ってこの PR をレビューしてください。",
    options: {
      model,
      maxBudgetUsd,
      additionalDirectories: ["pr-head"],
      // 読むだけの道具に絞る。allowedTools は渡さない: 渡すとどのパスの Read も通ってしまう。
      // dontAsk なら、確認が要る操作(作業ルートと pr-head/ の外を読むなど)は拒否される。
      // これで /proc/self/environ などから API キーを読まれない。
      tools: ["Read", "Grep", "Glob"],
      permissionMode: "dontAsk",
      // 外部の MCP サーバーは一切つながない。
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
          const target = block.input.file_path ?? block.input.pattern ?? "";
          console.log(`${block.name} ${target}`);
        }
      }
    }
    if (message.type === "result") {
      out.cost_usd = message.total_cost_usd ?? null;
      out.turns = message.num_turns ?? null;
      // 費用の内訳を Actions のログで追えるようにする(コメントには合計だけ出す)。
      console.log(`usage=${JSON.stringify(message.modelUsage ?? message.usage ?? {})}`);
      if (message.subtype === "success" && !message.is_error && message.structured_output) {
        out.structured = message.structured_output;
      } else {
        out.error = message.subtype;
      }
    }
  }
} catch (error) {
  // エラーの結果を返したあと query() は例外も投げる。先に記録した理由があればそちらを残す。
  out.error ??= String(error);
}

writeFileSync("review-input/result.json", JSON.stringify(out, null, 2));
console.log(
  `model=${out.model} turns=${out.turns} cost_usd=${out.cost_usd} ` +
    `verdict=${out.structured?.verdict ?? "-"} error=${out.error ?? "-"}`,
);
