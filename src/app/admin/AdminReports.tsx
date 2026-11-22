"use client";

import Link from "@/components/Link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@frost-ui/react/atoms/badge";
import { Button } from "@frost-ui/react/atoms/button";
import { EmptyState, EmptyStateTitle } from "@frost-ui/react/molecules/empty-state";
import { useToast } from "@frost-ui/react/organisms/toast";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { useI18n } from "@/lib/i18n/client";
import type { ReportedWork } from "@/lib/moderation";
import { getReportedWorks, moderateWork } from "@/lib/works";

// 通報のあった作品と、非公開にした作品の一覧。作品を開けば(運営なので非公開でも見える)消すこともできる。

type State = { status: "loading" } | { status: "forbidden" } | { status: "error" } | { status: "ready"; items: ReportedWork[] };

export function AdminReports() {
  const { t } = useI18n();
  const toast = useToast();
  const [state, setState] = useState<State>({ status: "loading" });
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    getReportedWorks().then(
      (items) => setState(items ? { status: "ready", items } : { status: "forbidden" }),
      () => setState({ status: "error" }),
    );
  }, []);
  useEffect(load, [load]);

  async function act(slug: string, action: "hide" | "restore") {
    setBusy(slug);
    try {
      await moderateWork(slug, action);
      toast.add({ title: action === "hide" ? t.moderation.admin.hidden : t.moderation.admin.restored });
      load();
    } catch {
      toast.add({ title: t.moderation.failed, description: t.moderation.retryLater, priority: "high" });
    } finally {
      setBusy(null);
    }
  }

  const a = t.moderation.admin;
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-sp-lg px-sp-xl pb-sp-xl pt-8">
        <h1 className="text-lg font-medium text-text-primary">{a.title}</h1>

        {state.status === "loading" && <p className="text-sm text-text-muted">{t.work.loading}</p>}
        {state.status === "forbidden" && (
          <EmptyState>
            <EmptyStateTitle>{a.notAdmin}</EmptyStateTitle>
          </EmptyState>
        )}
        {state.status === "error" && (
          <EmptyState>
            <EmptyStateTitle>{t.common.loadFailed}</EmptyStateTitle>
          </EmptyState>
        )}
        {state.status === "ready" && state.items.length === 0 && (
          <EmptyState>
            <EmptyStateTitle>{a.empty}</EmptyStateTitle>
          </EmptyState>
        )}

        {state.status === "ready" && state.items.length > 0 && (
          <ul className="flex flex-col divide-y divide-border-subtle border-y border-border-subtle">
            {state.items.map((work) => (
              <li key={work.slug} className="flex flex-col gap-2 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/s/${work.slug}`} className="text-sm font-medium text-text-primary underline-offset-2 hover:underline">
                    {work.title}
                  </Link>
                  <span className="text-xs text-text-secondary">
                    {work.author} · {work.createdAt.slice(0, 10)}
                  </span>
                  {work.reportCount > 0 && <Badge>{a.reports(work.reportCount)}</Badge>}
                  {work.hiddenBy && <Badge>{work.hiddenBy === "reports" ? a.hiddenByReports : a.hiddenByOperator}</Badge>}
                  {work.visibility === "private" && <Badge>{a.authorPrivate}</Badge>}
                  <span className="flex-1" />
                  {/* 戻す(restore)は通報も片付けるので、まだ非公開になっていない作品の「問題なし」にも使う */}
                  <Button variant="ghost" size="sm" disabled={busy === work.slug} onClick={() => void act(work.slug, "restore")}>
                    {work.hiddenBy ? a.restore : a.dismiss}
                  </Button>
                  {!work.hiddenBy && (
                    <Button variant="danger" size="sm" disabled={busy === work.slug} onClick={() => void act(work.slug, "hide")}>
                      {a.hide}
                    </Button>
                  )}
                </div>
                {work.reports.length > 0 && (
                  <ul className="flex flex-col gap-1 text-xs text-text-secondary">
                    {work.reports.map((report, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="shrink-0 font-mono text-text-muted">{report.createdAt.slice(0, 10)}</span>
                        <span className="shrink-0 text-text-primary">{t.moderation.reasons[report.reason].title}</span>
                        <span className="min-w-0 whitespace-pre-wrap break-words">{report.note || a.noNote}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
