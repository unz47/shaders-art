import { http, HttpResponse } from "msw";
import { works } from "./data";

// GET /api/works/:slug
export const getWork = http.get("/api/works/:slug", ({ params }) => {
  const work = works.find((w) => w.slug === params.slug);
  if (!work) return HttpResponse.json({ message: "not found" }, { status: 404 });
  return HttpResponse.json(work);
});
