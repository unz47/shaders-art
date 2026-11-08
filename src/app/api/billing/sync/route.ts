import { NextResponse, type NextRequest } from "next/server";
import { getDictionary } from "@/lib/i18n/server";
import { getAiLimits } from "@/lib/server/aiUsage";
import { getViewerBilling, toBillingStatus } from "@/lib/server/billing";
import { fulfillCheckoutSession } from "@/lib/server/billingSync";
import { getSession, isSameOriginRequest } from "@/lib/server/session";
import { getStripeConfig } from "@/lib/server/stripe";

// POST /api/billing/sync { sessionId }(要ログイン)→ { result, status: BillingStatus }
// Checkout から /me/billing に戻ってきたとき、webhook を待たずにその購入を記録に写す(webhook が遅れても、
// 戻ってすぐ Pro になるように)。webhook と同じ処理で、何度呼んでも同じ結果になる(lib/server/billingSync)。
// 他人の購入を写せないよう、Checkout の client_reference_id がログイン中の人と同じときだけ受け付ける。

const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]+$/;

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ message: "forbidden" }, { status: 403 });
  const t = await getDictionary();
  const session = await getSession();
  if (!session) return NextResponse.json({ message: t.api.loginNeeded }, { status: 401 });
  const config = await getStripeConfig();
  if (!config) return NextResponse.json({ message: t.billing.notConfigured }, { status: 503 });

  const body = (await request.json().catch(() => null)) as { sessionId?: unknown } | null;
  const sessionId = body?.sessionId;
  if (typeof sessionId !== "string" || !SESSION_ID.test(sessionId)) {
    return NextResponse.json({ message: t.billing.badItem }, { status: 400 });
  }

  try {
    const checkout = await config.stripe.checkout.sessions.retrieve(sessionId);
    if (checkout.client_reference_id !== session.sub) {
      return NextResponse.json({ message: t.billing.badItem }, { status: 404 });
    }
    const result = await fulfillCheckoutSession(config, checkout);
    const viewer = await getViewerBilling(session, getAiLimits().unlimitedEmails);
    return NextResponse.json(
      { result, status: toBillingStatus(viewer, { configured: true, testMode: config.testMode }) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[billing/sync]", error);
    return NextResponse.json({ message: t.billing.syncFailed }, { status: 502 });
  }
}
