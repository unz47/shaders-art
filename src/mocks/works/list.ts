import { http, HttpResponse } from "msw";
import { works } from "./data";

// GET /api/works?tab=collection|new
// collection = collected: true のもの、new = 投稿順(いまは全件を新しい順)
// 一覧もホバー再生用に source を含めて返す(詳細と同じ形)
export const listWorks = http.get("/api/works", ({ request }) => {
  const tab = new URL(request.url).searchParams.get("tab") ?? "collection";
  const filtered =
    tab === "collection" ? works.filter((w) => w.collected) : [...works].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return HttpResponse.json({ items: filtered });
});
