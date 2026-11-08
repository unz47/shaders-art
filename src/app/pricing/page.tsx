import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getDictionary } from "@/lib/i18n/server";
import { PricingPlans } from "./PricingPlans";

// /pricing … 料金(issue #42)。無料と Pro を並べ、その下に追加クレジット。
// 誰が見るか(ログイン・今のプラン)でボタンが変わるので、中身はブラウザで出す(PricingPlans)。

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: `${t.pricing.metaTitle} — shaders.art`, description: t.pricing.intro };
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
