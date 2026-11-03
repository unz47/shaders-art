import { NextResponse } from "next/server";
import { getDictionary } from "@/lib/i18n/server";
import { getAiLimits, getAiUsage } from "@/lib/server/aiUsage";
import { getSession } from "@/lib/server/session";

// GET /api/ai/usage(要ログイン)→ AiUsageStatus(lib/aiQuota)
// 今月のクレジットと今日の依頼の回数、それぞれの上限。/edit の AI 欄が残りを出すのに使う。
// 人ごとに違い、依頼のたびに変わるので、キャッシュさせない。
const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: (await getDictionary()).api.loginNeeded }, { status: 401, headers: NO_STORE });
  }
  return NextResponse.json(await getAiUsage(session, getAiLimits()), { headers: NO_STORE });
}
