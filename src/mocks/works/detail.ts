import { http, HttpResponse } from "msw";
import { works } from "./data";

// GET /api/works/:slug
export const getWork = http.get("/api/works/:slug", ({ params }) => {
  const work = works.find((w) => w.slug === params.slug);
  if (!work || work.visibility === "private") return HttpResponse.json({ message: "not found" }, { status: 404 });
  // モックにはログインが無いので、ログイン済みのほかの人が見ている形にする(通報ボタンが出る)
  return HttpResponse.json({ ...work, viewer: { signedIn: true, owner: false, admin: false, reported: false } });
});
