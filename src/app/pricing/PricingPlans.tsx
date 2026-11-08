"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { buttonVariants } from "@frost-ui/react/atoms/button";
import { startCheckout, useBillingStatus } from "@/lib/billing/client";
import {
  type BillingStatus,
  type CheckoutItem,
  CREDIT_PACK,
  DEFAULT_PRO_DAILY_REQUESTS,
  DEFAULT_PRO_MONTHLY_CREDITS,
  formatJpy,
  formatUsd,
  PRICES,
} from "@/lib/billing/plans";
import { DEFAULT_DAILY_REQUESTS, DEFAULT_MONTHLY_CREDITS } from "@/lib/aiQuota";
import { useI18n } from "@/lib/i18n/client";
import { loginHref } from "@/lib/useSession";

// 料金ページの中身。左に無料、右に Pro(月払い / 年払いを切り替える)、下に追加クレジット。
// ボタンは見る人で変わる: ログイン前は「ログインして始める」、Pro なら「利用中」、Stripe の設定が無ければ「準備中」。
// 押すと Stripe Checkout の画面に移る(POST /api/billing/checkout)。

type Interval = "month" | "year";

export function PricingPlans() {
  const { t } = useI18n();
  const { status, loading } = useBillingStatus();
  const [interval, setInterval] = useState<Interval>("year");
  const params = useSearchParams();
  const canceled = params.get("checkout") === "canceled";
  const proItem: CheckoutItem = interval === "year" ? "pro-yearly" : "pro-monthly";
  const pro = PRICES[proItem];
  const monthlyEquivalent = Math.round(PRICES["pro-yearly"].jpy / 12);

  return (
    <div className="flex flex-col gap-12 pb-sp-xl">
      <section className="flex max-w-3xl flex-col gap-4">
        <p className="text-xs font-medium tracking-wide text-accent-default">{t.pricing.eyebrow}</p>
        <h1 className="text-4xl font-medium tracking-tight text-text-primary sm:text-5xl">{t.pricing.title}</h1>
        <p className="max-w-[42rem] text-base leading-8 text-text-secondary">{t.pricing.intro}</p>
        {status?.testMode && (
          <p role="note" className="w-fit rounded-control bg-status-warning-subtle-bg px-3 py-1.5 text-sm text-text-primary">
            {t.pricing.testMode}
          </p>
        )}
        {canceled && (
          <p role="status" className="w-fit rounded-control bg-bg-raised px-3 py-1.5 text-sm text-text-secondary">
            {t.pricing.canceled}
          </p>
        )}
      </section>

      <div role="group" aria-label={t.pricing.billingInterval} className="flex w-fit gap-1 rounded-full border border-border-subtle p-1 text-sm">
        {(["month", "year"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={interval === value}
            onClick={() => setInterval(value)}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              interval === value ? "bg-text-primary text-bg-base" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {value === "month" ? t.pricing.monthly : t.pricing.yearly}
            {value === "year" && <span className="ml-1.5 text-xs opacity-80">{t.pricing.yearlySave}</span>}
          </button>
        ))}
      </div>

      <div className="grid gap-sp-lg md:grid-cols-2">
        <PlanCard
          name={t.pricing.free.name}
          price={formatJpy(0)}
          unit={t.pricing.perMonth}
          note={t.pricing.free.note}
          features={t.pricing.free.features(DEFAULT_MONTHLY_CREDITS, DEFAULT_DAILY_REQUESTS)}
          action={<FreeAction status={status} loading={loading} />}
        />
        <PlanCard
          highlighted
          name={t.pricing.pro.name}
          price={formatJpy(pro.jpy)}
          unit={interval === "year" ? t.pricing.perYear : t.pricing.perMonth}
          note={
            interval === "year"
              ? t.pricing.pro.yearlyNote(formatJpy(monthlyEquivalent), formatUsd(pro.usdCents))
              : t.pricing.pro.monthlyNote(formatUsd(pro.usdCents))
          }
          features={t.pricing.pro.features(DEFAULT_PRO_MONTHLY_CREDITS, DEFAULT_PRO_DAILY_REQUESTS)}
          action={<BuyButton item={proItem} status={status} loading={loading} label={t.pricing.pro.cta} />}
        />
      </div>

      <section id="credits" className="flex scroll-mt-24 flex-col gap-4 rounded-2xl border border-border-subtle px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-medium text-text-primary">{t.pricing.credits.title(CREDIT_PACK.credits)}</h2>
          <p className="text-sm leading-6 text-text-secondary">
            {t.pricing.credits.description(CREDIT_PACK.validMonths)}
          </p>
          <p className="text-sm text-text-primary">
            <span className="text-xl font-medium">{formatJpy(PRICES["credits-500"].jpy)}</span>
            <span className="ml-2 text-xs text-text-muted">
              {t.pricing.taxIncluded} · {t.pricing.outsideJapan(formatUsd(PRICES["credits-500"].usdCents))}
            </span>
          </p>
        </div>
        <div className="shrink-0">
          <BuyButton item="credits-500" status={status} loading={loading} label={t.pricing.credits.cta} variant="secondary" />
        </div>
      </section>

      <section className="flex max-w-3xl flex-col gap-3">
        <h2 className="text-lg font-medium text-text-primary">{t.pricing.notes.title}</h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-7 text-text-secondary marker:text-text-muted">
          {t.pricing.notes.items(CREDIT_PACK.validMonths).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="flex flex-wrap gap-x-sp-md text-sm">
          <Link href="/legal/commerce" className="text-text-secondary underline underline-offset-2 hover:text-text-primary">
            {t.pricing.notes.commerce}
          </Link>
          <Link href="/terms#paid" className="text-text-secondary underline underline-offset-2 hover:text-text-primary">
            {t.pricing.notes.terms}
          </Link>
        </p>
      </section>
    </div>
  );
}

function PlanCard({
  name,
  price,
  unit,
  note,
  features,
  action,
  highlighted = false,
}: {
  name: string;
  price: string;
  unit: string;
  note: string;
  features: string[];
  action: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <section
      className={`flex flex-col gap-5 rounded-2xl border px-6 py-6 ${
        highlighted ? "border-accent-default shadow-[0_0_0_1px_var(--color-accent-default)]" : "border-border-subtle"
      }`}
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-medium text-text-primary">{name}</h2>
        <p className="flex items-baseline gap-1.5">
          <span className="text-4xl font-medium tracking-tight text-text-primary">{price}</span>
          <span className="text-sm text-text-muted">{unit}</span>
        </p>
        <p className="min-h-5 text-xs text-text-muted">{note}</p>
      </div>
      <ul className="flex flex-1 flex-col gap-2">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2.5 text-sm leading-6 text-text-secondary">
            <span aria-hidden="true" className="text-accent-default">
              ✓
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {action}
    </section>
  );
}

function FreeAction({ status, loading }: { status: BillingStatus | null; loading: boolean }) {
  const { t } = useI18n();
  const pathname = usePathname();
  if (loading) return <span className={buttonVariants({ variant: "secondary", size: "lg" })} aria-hidden="true" />;
  if (status?.signedIn) {
    return (
      <p className="flex h-[var(--aurora-control-height-lg)] items-center text-sm text-text-muted">
        {status.plan === "free" ? t.pricing.free.current : t.pricing.free.included}
      </p>
    );
  }
  return (
    <a href={loginHref(pathname)} className={buttonVariants({ variant: "secondary", size: "lg" })}>
      {t.pricing.free.cta}
    </a>
  );
}

function BuyButton({
  item,
  status,
  loading,
  label,
  variant = "primary",
}: {
  item: CheckoutItem;
  status: BillingStatus | null;
  loading: boolean;
  label: string;
  variant?: "primary" | "secondary";
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const style = buttonVariants({ variant, size: "lg" });
  const subscribing = PRICES[item].interval !== null;

  if (loading) return <button type="button" disabled className={style}>{label}</button>;
  if (!status?.configured) {
    return (
      <button type="button" disabled className={style}>
        {t.pricing.comingSoon}
      </button>
    );
  }
  if (!status.signedIn) {
    return (
      <a href={loginHref(pathname)} className={style}>
        {t.pricing.loginToBuy}
      </a>
    );
  }
  if (subscribing && status.plan === "pro") {
    return (
      <Link href="/me/billing" className={buttonVariants({ variant: "secondary", size: "lg" })}>
        {status.operator ? t.pricing.pro.operator : t.pricing.pro.current}
      </Link>
    );
  }

  async function buy() {
    setPending(true);
    setError(null);
    const result = await startCheckout(item, t.billing.checkoutFailed);
    if (result.ok) {
      window.location.assign(result.url);
      return;
    }
    setError(result.message);
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={buy} disabled={pending} className={style}>
        {pending ? t.pricing.redirecting : label}
      </button>
      {error && (
        <p role="alert" className="text-sm text-danger-solid">
          {error}
        </p>
      )}
    </div>
  );
}
