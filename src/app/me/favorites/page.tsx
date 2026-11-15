import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { MyFavorites } from "./MyFavorites";

// /me/favorites … ログイン中の人のお気に入り(新しくお気に入りにした順)。本人だけが見るページ。
// 中身はブラウザで取る(MyFavorites)。
export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: `${t.me.favorites} — shaders.art`, robots: { index: false } };
}

export default function MyFavoritesPage() {
  return <MyFavorites />;
}
