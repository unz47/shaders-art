import type { Metadata } from "next";
import { ToastProvider, ToastViewport } from "@frost-ui/react/organisms/toast";
import { MockProvider } from "@/mocks/MockProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "shaders.art",
  description: "a museum of fragment shaders",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // frost-ui の既定は Dark。Figma の Home は Light を前提にしているので固定する
  return (
    <html lang="ja" data-theme="light">
      <body className="bg-bg-base text-text-primary">
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
