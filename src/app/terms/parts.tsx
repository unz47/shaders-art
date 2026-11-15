import type { ReactNode } from "react";

// 利用規約(日本語版 TermsJa・英語版 TermsEn)で共有する見た目の部品。

// 固定ヘッダー(高さ 64px)の下に見出しが隠れないよう、#license などで飛んだときに余白を取る
export function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-3">
      <h2 className="text-lg font-medium text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

export function H3({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h3 id={id} className="mt-2 scroll-mt-24 text-sm font-medium text-text-primary">
      {children}
    </h3>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-7 text-text-secondary">{children}</p>;
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-7 text-text-secondary">{children}</ul>;
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-text-primary">
      {children}
    </a>
  );
}
