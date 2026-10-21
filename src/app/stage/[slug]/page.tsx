import type { Metadata } from "next";
import { StageWork } from "./StageWork";

// /stage/{slug} … 公開作品の配信背景・壁紙・埋め込み用の全画面ページ。
// 中身の取得は WorkDetail と同じく、ブラウザから /api/works/:slug で行う。
export const metadata: Metadata = {
  title: "Stage — shaders.art",
  robots: { index: false },
};

interface Params {
  params: Promise<{ slug: string }>;
}

export default async function StageWorkPage({ params }: Params) {
  const { slug } = await params;
  return <StageWork slug={slug} />;
}
