import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { MyWorks } from "./MyWorks";

// /me … ログイン中の人が投稿した作品の一覧(非公開も含む)。本人だけが見るページなので
// 公開のプロフィールではない(作者名は投稿ごとの自己申告のまま)。中身はブラウザで取る(MyWorks)。
export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: `${t.me.myWorks} — shaders.art`, robots: { index: false } };
}

export default function MyWorksPage() {
  return <MyWorks />;
}
