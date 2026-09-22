import type { Metadata } from "next";
import { MockProvider } from "@/mocks/MockProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "shaders.art",
  description: "a museum of fragment shaders",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-bg-base text-text-primary">
        <MockProvider>{children}</MockProvider>
      </body>
    </html>
  );
}
