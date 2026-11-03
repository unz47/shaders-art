"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonVariants } from "@frost-ui/react/atoms/button";
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@frost-ui/react/molecules/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@frost-ui/react/organisms/select";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Pagination } from "@/components/Pagination";
import { WorkCard } from "@/components/WorkCard";
import { getWorks, type WorkSummary } from "@/lib/works";
import {
  WORKS_PAGE_SIZE,
  WORKS_SORT_LABELS,
  worksHref,
  type WorksPage,
  type WorksSort,
} from "@/lib/worksQuery";

// 仕様: Figma「すべて見る — /works(並び替え・ページ送り)」
// 上に見出しと件数、右に並び替え。24 件(4 列 × 6 段)ずつで、下にページ送り。
// 並び替えやページを変えている間は、前の一覧を薄くして残しておく(画面が空になって跳ねないように)。

type Result = { key: string; data: WorksPage<WorkSummary> } | { key: string; error: string };

export function WorksBrowser({ sort, page }: { sort: WorksSort; page: number }) {
  const router = useRouter();
  const key = `${sort}:${page}`;
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let cancelled = false;
    getWorks({ sort, page }).then(
      (data) => {
        if (!cancelled) setResult({ key, data });
      },
      (error: unknown) => {
        if (!cancelled) setResult({ key, error: error instanceof Error ? error.message : "" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key, sort, page]);

  const loading = result?.key !== key;
  const data = result && "data" in result ? result.data : null;
  const error = !loading && result && "error" in result ? result.error : null;
  const start = (page - 1) * WORKS_PAGE_SIZE;

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-7 px-sp-xl pt-10">
        <div className="flex flex-wrap items-end gap-sp-md">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <h1 className="text-2xl font-medium text-text-primary">すべての作品</h1>
            <p className="font-mono text-xs text-text-muted">{data ? `${data.total} works` : " "}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <span id="works-sort-label" className="text-[13px] text-text-secondary">
              並び替え
            </span>
            <Select
              items={WORKS_SORT_LABELS}
              value={sort}
              onValueChange={(value) => {
                // 並びを変えたら 1 ページ目に戻る
                if (value && value !== sort) router.push(worksHref({ sort: value }));
              }}
            >
              <SelectTrigger aria-labelledby="works-sort-label" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(WORKS_SORT_LABELS) as WorksSort[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {WORKS_SORT_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error !== null && (
          <EmptyState>
            <EmptyStateTitle>作品を読み込めませんでした</EmptyStateTitle>
            <EmptyStateDescription>{error}</EmptyStateDescription>
          </EmptyState>
        )}

        {!loading && data && data.total === 0 && (
          <EmptyState>
            <EmptyStateTitle>まだ作品がありません</EmptyStateTitle>
          </EmptyState>
        )}

        {!loading && data && data.total > 0 && data.items.length === 0 && (
          <EmptyState>
            <EmptyStateTitle>このページに作品はありません</EmptyStateTitle>
            <EmptyStateDescription>全部で {data.pageCount} ページです</EmptyStateDescription>
            <EmptyStateActions>
              <Link href={worksHref({ sort })} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                1 ページ目へ
              </Link>
            </EmptyStateActions>
          </EmptyState>
        )}

        {data && data.items.length > 0 && (
          <div
            aria-busy={loading}
            className={`grid grid-cols-1 content-start gap-x-sp-lg gap-y-8 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
              loading ? "opacity-50" : ""
            }`}
          >
            {data.items.map((work) => (
              <WorkCard key={work.slug} work={work} />
            ))}
          </div>
        )}

        {!loading && data && data.items.length > 0 && data.pageCount > 1 && (
          <div className="flex flex-col items-center gap-3 pt-6">
            <Pagination page={page} pageCount={data.pageCount} hrefFor={(p) => worksHref({ sort, page: p })} />
            <p className="font-mono text-xs text-text-muted">
              {start + 1}–{start + data.items.length} / {data.total} 件
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
