import type { Metadata } from "next";
import { MyFavorites } from "./MyFavorites";

// /me/favorites … ログイン中の人のお気に入り(新しくお気に入りにした順)。本人だけが見るページ。
// 中身はブラウザで取る(MyFavorites)。
export const metadata: Metadata = {
  title: "お気に入り — shaders.art",
  robots: { index: false },
};

export default function MyFavoritesPage() {
  return <MyFavorites />;
}
