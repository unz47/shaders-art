// 仕様: Figma "Home / Desktop 1440" > Pagination(node 25:226, Layout=Full)
// 1 ページ 24 件。作品が 24 件以下なら出さない(いまの 6 件では非表示になる)
const PAGE_SIZE = 24;

function pageList(total: number, current: number): (number | "…")[] {
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push("…");
  if (total > 1) pages.push(total);
  return pages;
}

export function Pagination({ itemCount, currentPage = 1 }: { itemCount: number; currentPage?: number }) {
  const totalPages = Math.ceil(itemCount / PAGE_SIZE);
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center px-sp-xl pt-12">
      <div className="flex items-center gap-sp-xs">
        <button
          disabled={currentPage <= 1}
          className="flex h-8 items-center justify-center rounded-control px-sp-sm text-sm font-medium text-text-secondary disabled:opacity-40"
        >
          ← Previous
        </button>
        <div className="flex items-center gap-1">
          {pageList(totalPages, currentPage).map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} className="flex h-8 w-6 items-center justify-center font-mono text-[13px] text-text-muted">
                …
              </span>
            ) : (
              <span
                key={p}
                className={
                  p === currentPage
                    ? "flex size-8 items-center justify-center rounded-control border border-border-default bg-bg-surface font-mono text-[13px] font-medium text-text-primary"
                    : "flex size-8 items-center justify-center rounded-control font-mono text-[13px] text-text-secondary"
                }
              >
                {p}
              </span>
            ),
          )}
        </div>
        <button
          disabled={currentPage >= totalPages}
          className="flex h-8 items-center justify-center rounded-control px-sp-sm text-sm font-medium text-text-secondary disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </nav>
  );
}
