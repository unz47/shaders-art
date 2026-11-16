import type { Metadata } from "next";
import { StageDraft } from "./StageDraft";

// /stage#src=… … /edit の下書きのコードを URL に入れた、配信背景・壁紙・埋め込み用の全画面ページ。
// コードは # 以降にあってサーバーには届かないので、中身はブラウザで読む(StageDraft)。
export const metadata: Metadata = {
  title: "Stage — shaders.art",
  robots: { index: false },
};

export default function StagePage() {
  return <StageDraft />;
}
