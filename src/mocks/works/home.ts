import { http, HttpResponse } from "msw";
import { selectHome } from "@/lib/worksQuery";
import { works } from "./data";

// GET /api/home
// 本物と同じく、今日の 1 点・Collection・New を選んで返す(lib/worksQuery)
export const getHome = http.get("/api/home", () => HttpResponse.json(selectHome(works, Date.now())));
