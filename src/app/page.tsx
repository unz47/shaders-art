"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, EmptyStateDescription, EmptyStateTitle } from "@frost-ui/react/molecules/empty-state";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { TodaysPick } from "@/components/TodaysPick";
import { WorkCard } from "@/components/WorkCard";
import { WorkTile } from "@/components/WorkTile";
import { useFavorites } from "@/lib/useFavorites";
import { getHome, type WorkSummary } from "@/lib/works";
import { worksHref, type HomeSelection } from "@/lib/worksQuery";

// 仕様: Figma「Home 一覧の見せ方」案 A+B ①(採用)。運営の「収蔵」はやめ、お気に入りに一本化した。
//   1 段目: 今日の 1 点(横 3 列 × 縦 2 段・常に再生)と、その横に 2 つ
//   Your favorites: ログイン中の人のお気に入り(1 つ以上あるときだけ)。「すべて見る」は /me/favorites
//   Popular: お気に入りの多い作品のモザイク(大小のタイル)。「すべて見る」は /works?sort=popular
//   New: 新しい順のカード 8 つ。「すべて見る」は /works?sort=new
// 作品が少ないうちは、モザイクを大小のない同じ大きさのタイルにする(大小の組み合わせは 6 つで組んである)。

/** モザイクの 6 つの大きさ(広い画面のとき)。1 つ目が縦 2 段、2 つ目が横 2 列、残りは 1 マス */
const MOSAIC_SPANS = ["lg:row-span-2", "lg:col-span-2", "", "", "", ""];
const UNIFORM_COLUMNS = ["", "lg:grid-cols-1", "lg:grid-cols-2", "lg:grid-cols-3", "lg:grid-cols-4"];
/** Your favorites に並べる数(1 段) */
const FAVORITES_ON_HOME = 4;

function SectionHeading({ title, note, href }: { title: string; note: string; href: string }) {
  return (
    <div className="flex items-baseline gap-2.5">
      <h2 className="text-base font-medium text-text-primary">{title}</h2>
      <span className="min-w-0 flex-1 truncate text-[13px] text-text-muted">{note}</span>
      <Link href={href} className="text-[13px] text-text-secondary transition-colors hover:text-text-primary">
        すべて見る →
      </Link>
    </div>
  );
}

function Mosaic({ works }: { works: WorkSummary[] }) {
  if (works.length >= MOSAIC_SPANS.length) {
    return (
      <div className="grid auto-rows-[180px] grid-cols-2 gap-4 lg:auto-rows-[260px] lg:grid-cols-4">
        {works.slice(0, MOSAIC_SPANS.length).map((work, i) => (
          <WorkTile key={work.slug} work={work} className={MOSAIC_SPANS[i]} />
        ))}
      </div>
    );
  }
  const shown = works.slice(0, 4);
  return (
    <div className={`grid auto-rows-[180px] grid-cols-2 gap-4 lg:auto-rows-[260px] ${UNIFORM_COLUMNS[shown.length]}`}>
      {shown.map((work) => (
        // 2 列のとき、数が奇数なら最後の 1 つを横いっぱいにして穴を作らない
        <WorkTile key={work.slug} work={work} className="max-lg:last:odd:col-span-2" />
      ))}
    </div>
  );
}

/** 今日の 1 点の横に置く 2 つ。お気に入りの多い作品から。足りなければ新しい作品で埋める */
function sideWorks(home: HomeSelection<WorkSummary>): WorkSummary[] {
  const used = new Set([home.pick?.slug]);
  const side: WorkSummary[] = [];
  for (const work of [...home.popular, ...home.latest]) {
    if (side.length === 2) break;
    if (used.has(work.slug)) continue;
    used.add(work.slug);
    side.push(work);
  }
  return side;
}

export default function Home() {
  const [home, setHome] = useState<HomeSelection<WorkSummary> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const favorites = useFavorites();

  useEffect(() => {
    getHome().then(setHome, (e: unknown) => setError(e instanceof Error ? e.message : ""));
  }, []);

  const side = home ? sideWorks(home) : [];
  const sideSlugs = new Set(side.map((work) => work.slug));
  const mosaic = home?.popular.filter((work) => !sideSlugs.has(work.slug)) ?? [];
  const myFavorites = favorites.status === "ready" ? favorites.items : [];

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-14 px-sp-xl pt-8">
        <h1 className="sr-only">shaders.art — a museum of fragment shaders</h1>

        {home === null && error === null && (
          <div aria-hidden="true" className="h-[536px] animate-pulse rounded-2xl bg-bg-raised" />
        )}
        {error !== null && (
          <EmptyState>
            <EmptyStateTitle>作品を読み込めませんでした</EmptyStateTitle>
            <EmptyStateDescription>{error}</EmptyStateDescription>
          </EmptyState>
        )}
        {home?.total === 0 && (
          <EmptyState>
            <EmptyStateTitle>まだ作品がありません</EmptyStateTitle>
          </EmptyState>
        )}

        {home?.pick && (
          <section aria-label="今日の 1 点" className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:grid-rows-[260px_260px]">
            <TodaysPick
              work={home.pick}
              className={`col-span-2 aspect-[4/3] sm:aspect-video lg:row-span-2 lg:aspect-auto ${
                side.length > 0 ? "lg:col-span-3" : "lg:col-span-4"
              }`}
            />
            {side.map((work) => (
              <WorkTile
                key={work.slug}
                work={work}
                className={`aspect-[16/10] lg:aspect-auto ${side.length === 1 ? "col-span-2 lg:col-span-1 lg:row-span-2" : ""}`}
              />
            ))}
          </section>
        )}

        {home && myFavorites.length > 0 && (
          <section className="flex flex-col gap-5">
            <SectionHeading title="Your favorites" note={`あなたのお気に入り · ${myFavorites.length}`} href="/me/favorites" />
            <div className="grid grid-cols-1 gap-x-sp-lg gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {myFavorites.slice(0, FAVORITES_ON_HOME).map((work) => (
                <WorkCard key={work.slug} work={work} />
              ))}
            </div>
          </section>
        )}

        {mosaic.length > 0 && (
          <section className="flex flex-col gap-5">
            <SectionHeading title="Popular" note="お気に入りの多い作品" href={worksHref({ sort: "popular" })} />
            <Mosaic works={mosaic} />
          </section>
        )}

        {home && home.latest.length > 0 && (
          <section className="flex flex-col gap-5">
            <SectionHeading title="New" note={`新着 · ${home.total}`} href={worksHref({ sort: "new" })} />
            <div className="grid grid-cols-1 gap-x-sp-lg gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {home.latest.map((work) => (
                <WorkCard key={work.slug} work={work} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
