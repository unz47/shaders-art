import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  // infra/ は別ランタイム(CDK・Lambda)なので対象外にする
  { ignores: [".next/**", "out/**", "node_modules/**", "next-env.d.ts", "public/mockServiceWorker.js", "infra/**"] },
  ...nextVitals,
  ...nextTs,
]);
