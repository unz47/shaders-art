import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getLocale } from "@/lib/i18n/server";
import { PrivacyEn } from "./PrivacyEn";
import { PrivacyJa } from "./PrivacyJa";

// /privacy … プライバシーポリシー。何を集め、何に使い、どこに送り、いつ消すかを、コードのとおりに書く
// (根拠のコードは各文書の冒頭のコメント)。集めるものや送り先を変えたら、ここも直すこと。
// 利用規約(/terms)と同じく、日本語版(PrivacyJa)が正文で、英語版(PrivacyEn)はその翻訳。
// [運営者の氏名]・[連絡先] は公開前に運営者が埋める。本番で公開する前に専門家に確認してもらうこと。
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "ja" ? "プライバシーポリシー — shaders.art" : "Privacy Policy — shaders.art" };
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  return (
    <div className="flex min-h-dvh flex-col">
      <Header showSearch={false} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-sp-xl pt-10">
        {locale === "ja" ? <PrivacyJa /> : <PrivacyEn />}
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
