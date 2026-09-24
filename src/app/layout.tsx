import type { Metadata } from "next";
import { ToastProvider, ToastViewport } from "@frost-ui/react/organisms/toast";
import { MockProvider } from "@/mocks/MockProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "shaders.art",
  description: "a museum of fragment shaders",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // frost-ui の既定は Dark。Figma の Home は Light を前提にしているので固定するが、
  // ヘッダーのトグルで Dark に切り替えられる(localStorage に保存)。
  // suppressHydrationWarning: 下のスクリプトが保存済みの好みに応じて data-theme を
  // 書き換えるので、SSR 時の "light" 決め打ちとズレてもハイドレーション警告を出さない。
  return (
    <html lang="ja" data-theme="light" suppressHydrationWarning>
      <body className="bg-bg-base text-text-primary">
        {/* 初回ペイント前に同期実行し、保存済みテーマが dark ならここで即反映する
            (React 側の切り替えを待つと一瞬 light が見えてしまう) */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t;}}catch(e){}})();",
          }}
        />
        <MockProvider>
          <ToastProvider>
            {children}
            {/* 既定は右下固定(right-sp-lg)。中央下にしたいので left/right を 0 にして mx-auto で中央寄せする */}
            <ToastViewport className="left-0 right-0 mx-auto" />
          </ToastProvider>
        </MockProvider>
      </body>
    </html>
  );
}
