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
import { useI18n } from "@/lib/i18n/client";
import { ApiError, getMyWorks, type WorkSummary } from "@/lib/works";

type State =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "error"; error: unknown }
  | { status: "ready"; items: WorkSummary[] };

export function MyWorks() {
  const session = useSession();
  const { t } = useI18n();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    getMyWorks().then(
      (items) => {
        if (!cancelled) setState(items ? { status: "ready", items } : { status: "signed-out" });
      },
      (error: unknown) => {
        if (!cancelled) setState({ status: "error", error });
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
          <h1 className="text-lg font-medium text-text-primary">{t.me.myWorks}</h1>
          {state.status === "ready" && state.items.length > 0 && (
            <span className="font-mono text-xs text-text-muted">
              {t.me.countWithPrivate(state.items.length, privateCount)}
            </span>
          )}
        </div>

        {state.status === "signed-out" && (
          <EmptyState>
            <EmptyStateTitle>{t.me.loginToSeeWorks}</EmptyStateTitle>
            {session.status === "ready" && !session.configured && (
              <EmptyStateDescription>{t.common.loginNotConfigured}</EmptyStateDescription>
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
            <EmptyStateTitle>{t.common.loadFailed}</EmptyStateTitle>
            {state.error instanceof ApiError && (
              <EmptyStateDescription>{t.common.requestFailed(state.error.status)}</EmptyStateDescription>
            )}
          </EmptyState>
        )}

        {state.status === "ready" && state.items.length === 0 && (
          <EmptyState>
            <EmptyStateTitle>{t.me.noWorks}</EmptyStateTitle>
            <EmptyStateDescription>{t.me.noWorksHint}</EmptyStateDescription>
            <EmptyStateActions>
              <Link href="/edit" className={buttonVariants({ variant: "primary", size: "sm" })}>
                {t.me.createWork}
              </Link>
            </EmptyStateActions>
          </EmptyState>
        )}

        {state.status === "ready" && state.items.length > 0 && (
          <div className="grid grid-cols-1 content-start gap-x-sp-lg gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
