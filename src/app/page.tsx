import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { scanAllWorks, toPublicWork } from "@/lib/server/db";
import { pageMetadata } from "@/lib/site";
import { websiteData } from "@/lib/structuredData";
import type { WorkSummary } from "@/lib/works";
import { type HomeSelection, selectHome } from "@/lib/worksQuery";
import { HomePage } from "./HomePage";

// / … Home。並べる作品はサーバーで選んで HTML に入れる(/api/home と同じ lib/worksQuery の selectHome)。
// ログイン中の人のお気に入りだけは、ブラウザで取る(HomePage)。

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getDictionary()]);
  return pageMetadata({ locale, path: "/", title: t.meta.homeTitle, description: t.meta.description, absoluteTitle: true });
}

export default async function Home() {
  const [locale, t] = await Promise.all([getLocale(), getDictionary()]);
  return (
    <>
      <JsonLd data={websiteData(locale, t)} />
      <HomePage initialHome={await readHome()} />
    </>
  );
}

async function readHome(): Promise<HomeSelection<WorkSummary> | null> {
  try {
    const home = selectHome(await scanAllWorks(), Date.now());
    return {
      ...home,
      pick: home.pick && toPublicWork(home.pick),
      popular: home.popular.map(toPublicWork),
      latest: home.latest.map(toPublicWork),
    };
  } catch (error) {
    // 表が読めなくても Home は出す(ブラウザが /api/home から取り直す)
    console.error("home page", error);
    return null;
  }
}
