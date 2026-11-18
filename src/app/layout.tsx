import type { Metadata } from "next";
import { ToastProvider, ToastViewport } from "@frost-ui/react/organisms/toast";
import { I18nProvider } from "@/lib/i18n/client";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { OG_IMAGE, SITE_URL } from "@/lib/site";
import { MockProvider } from "@/mocks/MockProvider";
import "./globals.css";

// 検索結果とリンクを貼ったときのカード。ページごとの title は template に入る(例: 作品名 — shaders.art)。
// カードの画像は app/og.png(ビルド時に 1 枚作る)。作品ページも今はこれを使う
export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: "shaders.art", template: "%s — shaders.art" },
    description: t.meta.description,
    openGraph: {
      siteName: "shaders.art",
      type: "website",
      title: "shaders.art",
      description: t.meta.description,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // 言語はサーバーで決めて(Cookie → Accept-Language → 英語)、ブラウザ側の文言(I18nProvider)と html の lang に渡す
  const locale = await getLocale();
  // frost-ui の既定は Dark。Figma の Home は Light を前提にしているので固定するが、
  // ヘッダーのトグルで Dark に切り替えられる(localStorage に保存)。
  // suppressHydrationWarning: 下のスクリプトが保存済みの好みに応じて data-theme を
  // 書き換えるので、SSR 時の "light" 決め打ちとズレてもハイドレーション警告を出さない。
  return (
    <html lang={locale} data-theme="light" suppressHydrationWarning>
      <body className="bg-bg-base text-text-primary">
        {/* 初回ペイント前に同期実行し、保存済みテーマが dark ならここで即反映する
            (React 側の切り替えを待つと一瞬 light が見えてしまう) */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t;}}catch(e){}})();",
          }}
        />
        <I18nProvider locale={locale}>
          <MockProvider>
            <ToastProvider>
              {children}
              {/* 既定は右下固定(right-sp-lg)。中央下にしたいので left/right を 0 にして mx-auto で中央寄せする */}
              {/* スマホ幅では下のタブバーに重ならないよう、その分だけ上げる */}
              <ToastViewport className="left-0 right-0 mx-auto max-sm:bottom-[calc(var(--tabbar-h)+1rem)]" />
            </ToastProvider>
          </MockProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
