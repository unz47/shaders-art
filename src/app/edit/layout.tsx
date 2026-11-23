import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/site";

// /edit のページ(page.tsx)はブラウザの部品なので、title などはここで付ける
export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getDictionary()]);
  return pageMetadata({ locale, path: "/edit", title: t.meta.editTitle, description: t.meta.editDescription });
}

export default function EditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
