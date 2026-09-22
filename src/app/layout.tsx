import type { Metadata } from "next";
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
        <MockProvider>{children}</MockProvider>
      </body>
    </html>
  );
}
