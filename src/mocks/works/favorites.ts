import { http, HttpResponse } from "msw";
import { works } from "./data";

// お気に入り。モックにはログインが無いので、ブラウザのメモリにだけ持つ(読み直すと消える)。
// GET    /api/me/favorites
// POST   /api/works/:slug/favorite
// DELETE /api/works/:slug/favorite
const favorited: string[] = [];

function setFavorite(slug: string, on: boolean) {
  const work = works.find((w) => w.slug === slug);
  if (!work) return HttpResponse.json({ message: "not found" }, { status: 404 });
  const index = favorited.indexOf(slug);
  if (on && index === -1) {
    favorited.unshift(slug);
    work.favoriteCount = (work.favoriteCount ?? 0) + 1;
  } else if (!on && index !== -1) {
    favorited.splice(index, 1);
    work.favoriteCount = (work.favoriteCount ?? 1) - 1;
  }
  return HttpResponse.json({ favorited: on, favoriteCount: work.favoriteCount ?? 0 });
}

export const favoriteHandlers = [
  http.get("/api/me/favorites", () =>
    HttpResponse.json({ items: favorited.flatMap((slug) => works.filter((w) => w.slug === slug)) }),
  ),
  http.post("/api/works/:slug/favorite", ({ params }) => setFavorite(String(params.slug), true)),
  http.delete("/api/works/:slug/favorite", ({ params }) => setFavorite(String(params.slug), false)),
];
