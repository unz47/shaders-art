#!/usr/bin/env node
// OpenNext(Lambda)は `.next/standalone/.next/...` という平らな構成を前提にしてるが、
// @frost-ui/* をnpm未公開のためsymlink経由で参照する都合で next.config.ts の
// turbopack.root を親ディレクトリまで広げていて、その影響で `output: "standalone"` の
// 出力が `.next/standalone/<このリポジトリのディレクトリ名>/...` と1階層深くなってしまう。
// OpenNextはpnpm-lock.yamlの位置だけでモノレポ判定するため、shaders-art自身に
// ロックファイルがあるこの構成とは噛み合わない。
// @frost-ui/* がnpm公開されてturbopack.rootの回避策が不要になったら、
// このスクリプトとpackage.jsonのbuildスクリプトへの組み込みごと消してよい。
import { existsSync, readdirSync, renameSync, rmdirSync } from "node:fs";
import { join } from "node:path";

const standaloneDir = join(process.cwd(), ".next", "standalone");

if (!existsSync(standaloneDir)) {
  console.log("[flatten-standalone] .next/standalone が無いのでスキップ");
  process.exit(0);
}

if (existsSync(join(standaloneDir, ".next"))) {
  console.log("[flatten-standalone] 既に平らな構成なのでスキップ");
  process.exit(0);
}

const nestedDirs = readdirSync(standaloneDir, { withFileTypes: true }).filter((e) => e.isDirectory());
if (nestedDirs.length !== 1) {
  console.error(
    "[flatten-standalone] ネストされたディレクトリが1つだけ見つかる想定だったが違った:",
    nestedDirs.map((d) => d.name),
  );
  process.exit(1);
}

const nestedDir = join(standaloneDir, nestedDirs[0].name);
for (const entry of readdirSync(nestedDir)) {
  renameSync(join(nestedDir, entry), join(standaloneDir, entry));
}
rmdirSync(nestedDir);
console.log(`[flatten-standalone] ${nestedDirs[0].name}/ の中身を .next/standalone/ 直下に移動した`);
