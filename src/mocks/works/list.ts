import { http, HttpResponse } from "msw";
import { works, type MockWork } from "./data";

// GET /api/works?tab=collection|new
// collection = collected: true のもの、new = 投稿順(いまは全件を新しい順)
// 一覧に GLSL 本体は要らないので source は落として返す(詳細でだけ取る)
function toSummary(work: MockWork) {
  const { source, ...summary } = work;
  void source;
  return summary;
}

export const listWorks = http.get("/api/works", ({ request }) => {
  const tab = new URL(request.url).searchParams.get("tab") ?? "collection";
  const filtered =
    tab === "collection" ? works.filter((w) => w.collected) : [...works].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return HttpResponse.json({ items: filtered.map(toSummary) });
});
