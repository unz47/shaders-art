import type { Metadata } from "next";
import { parsePage, parseQuery, parseSort } from "@/lib/worksQuery";
import { WorksBrowser } from "./WorksBrowser";

// /works … すべての作品と、作品の検索結果。並び替え(?sort=)・ページ(?page=)・検索語(?q=)は URL で持つ。
// Home の「すべて見る」(New → sort=new、Popular → sort=popular)と、ヘッダーの検索欄から来る。
// 一覧の取得はブラウザ側(WorksBrowser)。Home と同じく /api/works を使う。
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export async function generateMetadata({ searchParams }: PageProps<"/works">): Promise<Metadata> {
  const q = parseQuery(first((await searchParams).q));
  return { title: q ? `「${q}」の検索結果 — shaders.art` : "すべての作品 — shaders.art" };
}

export default async function WorksPage({ searchParams }: PageProps<"/works">) {
  const params = await searchParams;
  return (
    <WorksBrowser
      sort={parseSort(first(params.sort))}
      page={parsePage(first(params.page))}
      q={parseQuery(first(params.q))}
    />
  );
}
