import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getLocale } from "@/lib/i18n/server";
import { TermsEn } from "./TermsEn";
import { TermsJa } from "./TermsJa";

// /terms … 利用規約。作品のライセンス(#license)は YouTube と同じ考え方で、既定の「shaders.art 標準」は
// 著作権を作者に残し、ほかの人にはサイトの機能の中での利用だけを許す(lib/submission の LICENSES)。
// 投稿ダイアログと作品ページの License から #license に飛んでくる。
// 日本語版(TermsJa)が正文で、英語版(TermsEn)はその翻訳(食い違うときは日本語版が優先と、英語版の冒頭に書く)。
// 権利に関わる文書なので、本番で公開する前に専門家に確認してもらうこと(Notion の未解決の課題にも記載)。
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "ja" ? "利用規約 — shaders.art" : "Terms of Service — shaders.art" };
}

export default async function TermsPage() {
  const locale = await getLocale();
  return (
    <div className="flex min-h-dvh flex-col">
      <Header showSearch={false} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-sp-xl pt-10">
        {locale === "ja" ? <TermsJa /> : <TermsEn />}
        <p className="text-sm text-text-secondary">
          <Link href="/" className="underline underline-offset-2 hover:text-text-primary">
            {locale === "ja" ? "Gallery に戻る" : "Back to the Gallery"}
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
