import { http, HttpResponse } from "msw";
import { parsePage, parseQuery, parseSort, queryWorks } from "@/lib/worksQuery";
import { works } from "./data";

// GET /api/works?sort=new|popular|short&page=N&q=検索語
// 本物と同じく、公開作品を(q があれば絞り込んで)並べて 24 件ずつ返す(lib/worksQuery)
export const listWorks = http.get("/api/works", ({ request }) => {
  const params = new URL(request.url).searchParams;
  return HttpResponse.json(
    queryWorks(works, {
      sort: parseSort(params.get("sort")),
      page: parsePage(params.get("page")),
      q: parseQuery(params.get("q")),
    }),
  );
});
