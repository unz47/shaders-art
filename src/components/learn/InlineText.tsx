import Link from "next/link";
import type { ReactNode } from "react";

// レッスンの文の中の記法を描く。使えるのは `コード`・**強調**・[リンク](/learn/…) の 3 つだけ(lib/learn/types)。
// 強調とリンクの中には `コード` を入れられる。サーバーでもブラウザでも使う(フックを使わない)。

const TOKEN = /`([^`]+)`|\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

function parse(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let index = 0;
  for (const match of text.matchAll(TOKEN)) {
    const start = match.index;
    if (start > last) nodes.push(text.slice(last, start));
    const key = `${keyPrefix}${index++}`;
    const [, code, strong, label, href] = match;
    if (code !== undefined) {
      nodes.push(
        <code key={key} className="rounded-[4px] bg-bg-raised px-1 py-px font-mono text-[0.88em] text-text-primary">
          {code}
        </code>,
      );
    } else if (strong !== undefined) {
      nodes.push(
        <strong key={key} className="font-semibold text-text-primary">
          {parse(strong, `${key}-`)}
        </strong>,
      );
    } else if (label !== undefined && href !== undefined) {
      const className = "text-text-primary underline decoration-accent-default underline-offset-[3px] hover:text-accent-default";
      nodes.push(
        href.startsWith("/") ? (
          <Link key={key} href={href} className={className}>
            {parse(label, `${key}-`)}
          </Link>
        ) : (
          <a key={key} href={href} target="_blank" rel="noopener" className={className}>
            {parse(label, `${key}-`)}
          </a>
        ),
      );
    }
    last = start + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function InlineText({ text }: { text: string }) {
  return <>{parse(text, "")}</>;
}
