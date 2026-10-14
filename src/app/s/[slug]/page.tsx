import { WorkDetail } from "./WorkDetail";

// SSR なので slug は全部リクエスト時に解決する(投稿された作品もそのまま開ける)。
// 中身の取得は WorkDetail が実行時に /api/works/:slug から行う。

interface Params {
  params: Promise<{ slug: string }>;
}

export default async function WorkPage({ params }: Params) {
  const { slug } = await params;
  return <WorkDetail slug={slug} />;
}
