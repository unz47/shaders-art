"use client";

import Link from "next/link";
import { buttonVariants } from "@frost-ui/react/atoms/button";
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@frost-ui/react/molecules/empty-state";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WorkCard } from "@/components/WorkCard";
import { useFavorites } from "@/lib/useFavorites";
import { loginHref, useSession } from "@/lib/useSession";
import { worksHref } from "@/lib/worksQuery";

// お気に入り(lib/useFavorites)を並べる。♡ を外した作品も、ページを読み直すまでは並べたままにする
// (押し間違いをすぐ戻せるように)。
export function MyFavorites() {
  const session = useSession();
  const favorites = useFavorites();

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-sp-lg px-sp-xl pt-8">
        <div className="flex items-baseline gap-sp-sm">
          <h1 className="text-lg font-medium text-text-primary">お気に入り</h1>
          {favorites.status === "ready" && favorites.items.length > 0 && (
            <span className="font-mono text-xs text-text-muted">{favorites.items.length} 件</span>
          )}
        </div>

        {favorites.status === "signed-out" && (
          <EmptyState>
            <EmptyStateTitle>お気に入りを見るにはログインしてください</EmptyStateTitle>
            {session.status === "ready" && !session.configured && (
              <EmptyStateDescription>このサーバーにはログインが設定されていません</EmptyStateDescription>
            )}
            {session.status === "ready" && session.configured && (
              <EmptyStateActions>
                {/* Route Handler へのフルページ遷移なので <Link> ではなく <a> */}
                <a href={loginHref("/me/favorites")} className={buttonVariants({ variant: "primary", size: "sm" })}>
                  Sign in
                </a>
              </EmptyStateActions>
            )}
          </EmptyState>
        )}

        {favorites.status === "ready" && favorites.items.length === 0 && (
          <EmptyState>
            <EmptyStateTitle>まだお気に入りはありません</EmptyStateTitle>
            <EmptyStateDescription>作品の ♡ を押すと、ここに並びます</EmptyStateDescription>
            <EmptyStateActions>
              <Link href={worksHref({ sort: "new" })} className={buttonVariants({ variant: "primary", size: "sm" })}>
                作品を見る
              </Link>
            </EmptyStateActions>
          </EmptyState>
        )}

        {favorites.status === "ready" && favorites.items.length > 0 && (
          <div className="grid grid-cols-1 content-start gap-x-sp-lg gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.items.map((work) => (
              <WorkCard key={work.slug} work={work} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
