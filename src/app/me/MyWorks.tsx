"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import { loginHref, useSession } from "@/lib/useSession";
import { getMyWorks, type WorkSummary } from "@/lib/works";

type State =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "error"; message: string }
  | { status: "ready"; items: WorkSummary[] };

export function MyWorks() {
  const session = useSession();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    getMyWorks().then(
      (items) => {
        if (!cancelled) setState(items ? { status: "ready", items } : { status: "signed-out" });
      },
      (error: unknown) => {
        if (!cancelled) setState({ status: "error", message: error instanceof Error ? error.message : "" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const privateCount = state.status === "ready" ? state.items.filter((w) => w.visibility === "private").length : 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-sp-lg px-sp-xl pb-sp-xl pt-8">
        <div className="flex items-baseline gap-sp-sm">
          <h1 className="text-lg font-medium text-text-primary">自分の作品</h1>
          {state.status === "ready" && state.items.length > 0 && (
            <span className="font-mono text-xs text-text-muted">
              {state.items.length} 件{privateCount > 0 && `(うち非公開 ${privateCount})`}
            </span>
          )}
        </div>

        {state.status === "signed-out" && (
          <EmptyState>
            <EmptyStateTitle>自分の作品を見るにはログインしてください</EmptyStateTitle>
            {session.status === "ready" && !session.configured && (
              <EmptyStateDescription>このサーバーにはログインが設定されていません</EmptyStateDescription>
            )}
            {session.status === "ready" && session.configured && (
              <EmptyStateActions>
                {/* Route Handler へのフルページ遷移なので <Link> ではなく <a> */}
                <a href={loginHref("/me")} className={buttonVariants({ variant: "primary", size: "sm" })}>
                  Sign in
                </a>
              </EmptyStateActions>
            )}
          </EmptyState>
        )}

        {state.status === "error" && (
          <EmptyState>
            <EmptyStateTitle>作品を読み込めませんでした</EmptyStateTitle>
            <EmptyStateDescription>{state.message}</EmptyStateDescription>
          </EmptyState>
        )}

        {state.status === "ready" && state.items.length === 0 && (
          <EmptyState>
            <EmptyStateTitle>まだ投稿した作品はありません</EmptyStateTitle>
            <EmptyStateDescription>Edit で作って、プレビューの下の「Submitへ進む」から投稿できます</EmptyStateDescription>
            <EmptyStateActions>
              <Link href="/edit" className={buttonVariants({ variant: "primary", size: "sm" })}>
                作品を作る
              </Link>
            </EmptyStateActions>
          </EmptyState>
        )}

        {state.status === "ready" && state.items.length > 0 && (
          <div className="grid grid-cols-1 content-start gap-sp-lg sm:grid-cols-2 lg:grid-cols-3">
            {state.items.map((work) => (
              <WorkCard key={work.slug} work={work} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
