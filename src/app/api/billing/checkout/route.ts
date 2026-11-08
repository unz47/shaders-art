import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { canSellLive } from "@/lib/billing/commerce";
import { isCheckoutItem, PRICES } from "@/lib/billing/plans";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getAiLimits } from "@/lib/server/aiUsage";
import { getViewerBilling } from "@/lib/server/billing";
import { getSession, isSameOriginRequest, siteOrigin } from "@/lib/server/session";
import { getStripeConfig, priceIdFor } from "@/lib/server/stripe";

// POST /api/billing/checkout { item: "pro-monthly" | "pro-yearly" | "credits-500" }(要ログイン)→ { url }
// Stripe Checkout(Stripe が持つ支払いの画面)を作り、その URL を返す。ブラウザはそこへ移る。
// カード番号などはこのサイトを通らない。支払いが済んだら Stripe が webhook で知らせ、
// 戻ってきた /me/billing でも POST /api/billing/sync で確かめる(lib/server/billingSync)。
// どのユーザーの購入かは client_reference_id と metadata.userId(Cognito の sub)で結び付ける。

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ message: "forbidden" }, { status: 403 });
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ message: t.api.jsonOnly }, { status: 415 });
  }
  const session = await getSession();
  if (!session) return NextResponse.json({ message: t.api.loginNeeded }, { status: 401 });
  const config = await getStripeConfig();
  // 本番の鍵では、特定商取引法の表記がそろうまで売らない(lib/billing/commerce)
  if (!config || (!config.testMode && !canSellLive())) {
    return NextResponse.json({ message: t.billing.notConfigured }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { item?: unknown } | null;
  const item = body?.item;
  if (!isCheckoutItem(item)) return NextResponse.json({ message: t.billing.badItem }, { status: 400 });
  const price = PRICES[item];
  const subscribing = price.interval !== null;

  try {
    const viewer = await getViewerBilling(session, getAiLimits().unlimitedEmails);
    // 2 つ目の契約を作らない(月払い ↔ 年払いの切り替えは、契約の管理画面で行う)
    if (subscribing && viewer.plan === "pro") {
      return NextResponse.json({ message: viewer.operator ? t.billing.operatorNoNeed : t.billing.alreadyPro }, { status: 409 });
    }
    const priceId = await priceIdFor(config, item);
    if (!priceId) {
      console.error(JSON.stringify({ msg: "billing-price-missing", lookupKey: price.lookupKey }));
      return NextResponse.json({ message: t.billing.notConfigured }, { status: 503 });
    }

    const origin = siteOrigin(request);
    const customer = viewer.record.stripeCustomerId;
    const metadata = { userId: session.sub, item };
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: subscribing ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: session.sub,
      metadata,
      ...(customer ? { customer } : session.email ? { customer_email: session.email } : {}),
      locale: locale === "ja" ? "ja" : "en",
      success_url: `${origin}/me/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?checkout=canceled`,
      custom_text: { submit: { message: t.billing.checkoutAgreement } },
      // Stripe が売り手になる Managed Payments は、新しいアカウントだと既定で有効になっている。
      // 有効なままだと custom_text が使えず、特商法の表記(売り手はこのサイトの運営)とも食い違うので、毎回切る
      managed_payments: { enabled: false },
      ...(subscribing
        ? { subscription_data: { metadata } }
        : {
            payment_intent_data: { metadata },
            // 次の購入と契約の管理画面で使い回せるよう、1 回払いでも顧客を作る
            ...(customer ? {} : { customer_creation: "always" as const }),
          }),
    };
    const checkout = await config.stripe.checkout.sessions.create(params);
    if (!checkout.url) throw new Error("Checkout の URL がありません");
    console.log(JSON.stringify({ msg: "billing-checkout", user: session.sub, item }));
    return NextResponse.json({ url: checkout.url }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[billing/checkout]", error);
    return NextResponse.json({ message: t.billing.checkoutFailed }, { status: 502 });
  }
}
