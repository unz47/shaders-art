import type { Metadata } from "next";
import { parsePage, parseSort } from "@/lib/worksQuery";
import { WorksBrowser } from "./WorksBrowser";

// /works … すべての作品。並び替え(?sort=)とページ(?page=)は URL で持つ。
// Home の「すべて見る」から来る(New → sort=new、Popular → sort=popular)。
// 一覧の取得はブラウザ側(WorksBrowser)。Home と同じく /api/works を使う。
export const metadata: Metadata = {
  title: "すべての作品 — shaders.art",
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function WorksPage({ searchParams }: PageProps<"/works">) {
  const params = await searchParams;
  return <WorksBrowser sort={parseSort(first(params.sort))} page={parsePage(first(params.page))} />;
}
