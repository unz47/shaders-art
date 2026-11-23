import { NextResponse } from "next/server";
import { canSellLive } from "@/lib/billing/commerce";
import { getAiLimits } from "@/lib/server/aiUsage";
import { getViewerBilling, toBillingStatus } from "@/lib/server/billing";
import { getSession } from "@/lib/server/session";
import { getStripeConfig } from "@/lib/server/stripe";

// GET /api/billing/status → BillingStatus(lib/billing/plans)
// いまのプラン(無料 / Pro)、契約の状態、使える追加クレジット。ログインしていなくても答える(料金ページのボタンの出し分けに使う)。
// 人ごとに違い、購入のたびに変わるので、キャッシュさせない。
export async function GET() {
  const [session, stripe] = await Promise.all([getSession(), getStripeConfig()]);
  const viewer = session ? await getViewerBilling(session, getAiLimits().unlimitedEmails) : null;
  return NextResponse.json(
    toBillingStatus(viewer, {
      // 本番の鍵では、特定商取引法の表記がそろうまで買うボタンを出さない(lib/billing/commerce)
      configured: stripe !== null && (stripe.testMode || canSellLive()),
      testMode: stripe?.testMode ?? false,
    }),
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
