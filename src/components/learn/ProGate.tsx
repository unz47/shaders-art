import Link from "next/link";
import { buttonVariants } from "@frost-ui/react/atoms/button";
import { formatJpy, PRICES } from "@/lib/billing/plans";
import type { Dictionary } from "@/lib/i18n";
import { ProRecheck } from "./ProRecheck";

// Pro の回を Pro でない人が開いたとき、最初の節の下に出す案内(issue #42)。
// ログインしていない人には、Pro の人がログインし忘れている場合に備えて「ログイン」も出す(ProRecheck が戻り先を作る)。
export function ProGate({ slug, t, remainingSections }: { slug: string; t: Dictionary; remainingSections: number }) {
  return (
    <section className="relative flex max-w-[42rem] flex-col gap-4 rounded-2xl border border-accent-default/40 bg-bg-raised/60 px-6 py-6">
      {/* 本文が続いていることを、上の段落が薄れていく形で見せる */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 h-24 bg-gradient-to-b from-transparent to-bg-base"
      />
      <p className="text-xs font-medium tracking-wide text-accent-default">Pro</p>
      <h2 className="text-xl font-medium text-text-primary">{t.learn.pro.title}</h2>
      <p className="text-[15px] leading-7 text-text-secondary">
        {t.learn.pro.description(remainingSections, formatJpy(PRICES["pro-monthly"].jpy))}
      </p>
      <div className="flex flex-wrap items-center gap-sp-sm">
        <Link href="/pricing" className={buttonVariants({ variant: "primary" })}>
          {t.learn.pro.cta}
        </Link>
        <ProRecheck slug={slug} />
      </div>
      <p className="text-xs text-text-muted">{t.learn.pro.freeNote}</p>
    </section>
  );
}
