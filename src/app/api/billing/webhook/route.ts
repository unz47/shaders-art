import { NextResponse, type NextRequest } from "next/server";
import { handleStripeWebhook } from "@/lib/server/billingWebhook";
import { getStripeConfig } from "@/lib/server/stripe";

// POST /api/billing/webhook … Stripe からの通知(issue #42)。署名(Stripe-Signature)を確かめてから処理する
// (lib/server/billingWebhook)。ログインもオリジンの確認もしない(送ってくるのは Stripe のサーバー)。
// 処理に失敗したら 500 を返し、Stripe に送り直してもらう。知らない通知は 200 で受け流す。

export async function POST(request: NextRequest) {
  const config = await getStripeConfig();
  const webhookSecret = config?.webhookSecret;
  if (!config || !webhookSecret) return NextResponse.json({ message: "not configured" }, { status: 503 });

  const outcome = await handleStripeWebhook(
    { ...config, webhookSecret },
    await request.text(),
    request.headers.get("stripe-signature"),
  );
  if (outcome.status === 200) return NextResponse.json({ received: true });
  if (outcome.status === 400) return NextResponse.json({ message: outcome.reason }, { status: 400 });
  return NextResponse.json({ message: "failed" }, { status: 500 });
}
