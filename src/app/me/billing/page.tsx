import type { Metadata } from "next";
import { Suspense } from "react";
import { getDictionary } from "@/lib/i18n/server";
import { MyBilling } from "./MyBilling";

// /me/billing … 自分のプランと支払い(issue #42)。本人だけが見るページ。中身はブラウザで取る(MyBilling)。
// Stripe Checkout から戻ってくる先でもある(?checkout=success&session_id=…)。
export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: `${t.billing.title} — shaders.art`, robots: { index: false } };
}

export default function MyBillingPage() {
  return (
    <Suspense>
      <MyBilling />
    </Suspense>
  );
}
