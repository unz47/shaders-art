import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/moderation";
import { listReportedWorks } from "@/lib/server/moderation";
import { getSession } from "@/lib/server/session";

// GET /api/admin/reports(運営だけ)→ { items: ReportedWork[] }
// 通報があるか、非公開にされている作品。運営でなければ 404(この API があることも知らせない)。

export async function GET() {
  if (!isAdmin(await getSession())) {
    return NextResponse.json({ message: "not found" }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  }
  return NextResponse.json({ items: await listReportedWorks() }, { headers: { "Cache-Control": "private, no-store" } });
}
