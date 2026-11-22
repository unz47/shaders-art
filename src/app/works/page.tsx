import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { scanAllWorks, toPublicWork } from "@/lib/server/db";
import { pageMetadata } from "@/lib/site";
import type { WorkSummary } from "@/lib/works";
import { parsePage, parseQuery, parseSort, queryWorks, type WorksPage as Page } from "@/lib/worksQuery";
import { WorksBrowser } from "./WorksBrowser";

// /works … すべての作品と、作品の検索結果。並び替え(?sort=)・ページ(?page=)・検索語(?q=)は URL で持つ。
// Home の「すべて見る」(New → sort=new、Popular → sort=popular)と、ヘッダーの検索欄から来る。
// 一覧はサーバーで読んで HTML に入れる(/api/works と同じ lib/worksQuery)。読めなかったときだけブラウザが /api/works から取る。
// 並び替えとページ違いは同じページなので、正規の URL は /works にする。検索結果は検索エンジンに載せない。
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export async function generateMetadata({ searchParams }: PageProps<"/works">): Promise<Metadata> {
  const [params, locale, t] = await Promise.all([searchParams, getLocale(), getDictionary()]);
  const q = parseQuery(first(params.q));
  return {
    ...pageMetadata({ locale, path: "/works", title: q ? t.works.searchTitle(q) : t.works.title, description: t.meta.works }),
    ...(q ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function WorksPage({ searchParams }: PageProps<"/works">) {
  const params = await searchParams;
  const sort = parseSort(first(params.sort));
  const page = parsePage(first(params.page));
  const q = parseQuery(first(params.q));
  return <WorksBrowser sort={sort} page={page} q={q} initial={await readWorks({ sort, page, q })} />;
}

async function readWorks(query: Parameters<typeof queryWorks>[1]): Promise<Page<WorkSummary> | null> {
  try {
    const result = queryWorks(await scanAllWorks(), query);
    return { ...result, items: result.items.map(toPublicWork) };
  } catch (error) {
    console.error("works page", error);
    return null;
  }
}
