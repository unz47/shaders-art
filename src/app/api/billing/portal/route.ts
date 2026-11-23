import { NextResponse, type NextRequest } from "next/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getBillingRecord } from "@/lib/server/billing";
import { getSession, isSameOriginRequest, siteOrigin } from "@/lib/server/session";
import { getStripeConfig } from "@/lib/server/stripe";

// POST /api/billing/portal(要ログイン)→ { url }
// Stripe の顧客ポータル(解約・支払い方法の変更・月払い ↔ 年払い・領収書)を開く URL を返す。
// 何をできるようにするかは Stripe 側のポータルの設定(scripts/stripe-setup.mts が作る)で決まる。

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ message: "forbidden" }, { status: 403 });
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  const session = await getSession();
  if (!session) return NextResponse.json({ message: t.api.loginNeeded }, { status: 401 });
  const config = await getStripeConfig();
  if (!config) return NextResponse.json({ message: t.billing.notConfigured }, { status: 503 });

  try {
    const { stripeCustomerId } = await getBillingRecord(session.sub);
    if (!stripeCustomerId) return NextResponse.json({ message: t.billing.noCustomer }, { status: 404 });
    const portal = await config.stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${siteOrigin(request)}/me/billing`,
      locale: locale === "ja" ? "ja" : "en",
    });
    return NextResponse.json({ url: portal.url }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[billing/portal]", error);
    return NextResponse.json({ message: t.billing.portalFailed }, { status: 502 });
  }
}
