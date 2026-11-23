import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/site";
import { PricingPlans } from "./PricingPlans";

// /pricing … 料金(issue #42)。無料と Pro を並べ、その下に追加クレジット。
// 誰が見るか(ログイン・今のプラン)でボタンが変わるので、中身はブラウザで出す(PricingPlans)。

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getDictionary()]);
  return pageMetadata({ locale, path: "/pricing", title: t.pricing.metaTitle, description: t.pricing.intro });
}

export default function PricingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header showSearch={false} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-sp-md pt-10 sm:px-sp-xl">
        {/* PricingPlans は URL の ?checkout=canceled を読むので Suspense で囲む */}
        <Suspense>
          <PricingPlans />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
