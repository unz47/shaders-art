import { http, HttpResponse } from "msw";
import { works } from "./data";

// 作者の公開切り替え・削除、通報、運営の一覧。モックにはログインが無いので、どれも成功として返す
// (画面の流れを確かめる用。データは書き換えない)。
export const moderationHandlers = [
  http.patch("/api/works/:slug", async ({ request }) => {
    const body = (await request.json().catch(() => null)) as { visibility?: string } | null;
    return HttpResponse.json({ visibility: body?.visibility ?? "public" });
  }),
  http.delete("/api/works/:slug", () => new HttpResponse(null, { status: 204 })),
  http.post("/api/works/:slug/report", () => HttpResponse.json({ reported: true })),
  http.get("/api/admin/reports", () =>
    HttpResponse.json({
      items: works.slice(0, 1).map((work) => ({
        slug: work.slug,
        title: work.title,
        author: work.author,
        createdAt: work.createdAt,
        reportCount: 1,
        reports: [{ reason: "spam", note: "モックの通報", createdAt: "2026-11-15T00:00:00.000Z" }],
      })),
    }),
  ),
  http.post("/api/admin/works/:slug", () => HttpResponse.json({ ok: true })),
];
