import Link from "next/link";

// 仕様: Figma "Home / Desktop 1440" > Pagination(node 25:226, Layout=Full)
// ページは URL(?page=)で持つので、ボタンではなくリンクにする(戻る・共有でも同じページに戻れる)。
// 1 ページしか無ければ出さない。

function pageList(total: number, current: number): (number | "…")[] {
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push("…");
  if (total > 1) pages.push(total);
  return pages;
}

const stepClass = "flex h-8 items-center justify-center rounded-control px-sp-sm text-sm font-medium text-text-secondary";
const pageClass = "flex size-8 items-center justify-center rounded-control font-mono text-[13px]";

export function Pagination({
  page,
  pageCount,
  hrefFor,
  label,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
  /** 読み上げ用の名前(画面の言語で) */
  label: string;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label={label} className="flex items-center gap-sp-xs">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={`${stepClass} hover:text-text-primary`}>
          ← Previous
        </Link>
      ) : (
        <span aria-disabled="true" className={`${stepClass} opacity-40`}>
          ← Previous
        </span>
      )}
      <div className="flex items-center gap-1">
        {pageList(pageCount, page).map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="flex h-8 w-6 items-center justify-center font-mono text-[13px] text-text-muted">
              …
            </span>
          ) : p === page ? (
            <span
              key={p}
              aria-current="page"
              className={`${pageClass} border border-border-default bg-bg-surface font-medium text-text-primary`}
            >
              {p}
            </span>
          ) : (
            <Link key={p} href={hrefFor(p)} className={`${pageClass} text-text-secondary hover:text-text-primary`}>
              {p}
            </Link>
          ),
        )}
      </div>
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={`${stepClass} hover:text-text-primary`}>
          Next →
        </Link>
      ) : (
        <span aria-disabled="true" className={`${stepClass} opacity-40`}>
          Next →
        </span>
      )}
    </nav>
  );
}
