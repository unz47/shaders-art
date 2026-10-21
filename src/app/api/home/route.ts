import { NextResponse } from "next/server";
import { scanAllWorks, toPublicWork } from "@/lib/server/db";
import { selectHome } from "@/lib/worksQuery";

// GET /api/home → { pick, collection, collectedTotal, latest, total }
// Home(案 A+B ①)に出す作品をまとめて返す。今日の 1 点は日本時間の日付で決まる(lib/worksQuery)。
export async function GET() {
  const home = selectHome(await scanAllWorks(), Date.now());
  return NextResponse.json({
    ...home,
    pick: home.pick && toPublicWork(home.pick),
    collection: home.collection.map(toPublicWork),
    latest: home.latest.map(toPublicWork),
  });
}
