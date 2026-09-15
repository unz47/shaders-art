import path from "node:path";
import type { NextConfig } from "next";

// @frost-ui/* が npm 公開されるまでは pnpm.overrides の link: で隣の design-system を参照している。
// Turbopack はプロジェクト外へ抜ける symlink を辿れないので、root を親ディレクトリに広げる。
// npm 公開後は overrides と一緒にこの root 指定を外す。
const LINKED_DESIGN_SYSTEM = true;

const nextConfig: NextConfig = {
  // GitHub Pages / S3 に置く静的サイト。サーバー機能は使わない
  output: "export",
  // GitHub Pages のサブパス配信用。カスタムドメインを当てたら CI から BASE_PATH を外す
  basePath: process.env.BASE_PATH ?? "",
  trailingSlash: true,
  images: { unoptimized: true },
  // @frost-ui/react は TS ソース配布なので消費側でトランスパイルする
  transpilePackages: ["@frost-ui/react"],
  ...(LINKED_DESIGN_SYSTEM ? { turbopack: { root: path.resolve(__dirname, "..") } } : {}),
};

export default nextConfig;
