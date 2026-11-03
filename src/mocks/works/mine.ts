import { http, HttpResponse } from "msw";
import { works } from "./data";

// GET /api/me/works
// モックにはログインが無いので、非公開も含むすべての作品を自分の作品として新しい順に返す
export const listMyWorks = http.get("/api/me/works", () => {
  const items = [...works].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return HttpResponse.json({ items });
});
