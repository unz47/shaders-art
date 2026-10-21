import { http, HttpResponse } from "msw";
import { works } from "./data";

// GET /api/works?tab=collection|new
// 公開作品だけを返し、新しい順で表示する。collection / new は既存 URL 互換のクエリ。
// 一覧もホバー再生用に source を含めて返す(詳細と同じ形)
export const listWorks = http.get("/api/works", () => {
  const visibleWorks = works.filter((work) => work.visibility !== "private");
  const filtered = [...visibleWorks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return HttpResponse.json({ items: filtered });
});
