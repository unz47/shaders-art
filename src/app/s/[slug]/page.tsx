import { works } from "@/mocks/works/data";
import { WorkDetail } from "./WorkDetail";

// 静的書き出し(output: "export")では動的セグメントを全列挙する必要がある。
// 一覧はビルド時にこのモック配列から作るが、中身の取得は WorkDetail が
// 実行時にモック API(fetch)から行う。本物のバックエンドになっても
// この一覧の取り方だけ差し替えればいい。
export function generateStaticParams() {
  return works.map((w) => ({ slug: w.slug }));
}

interface Params {
  params: Promise<{ slug: string }>;
}

export default async function WorkPage({ params }: Params) {
  const { slug } = await params;
  return <WorkDetail slug={slug} />;
}
