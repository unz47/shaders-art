"use client";

import Link from "@/components/Link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { buttonVariants } from "@frost-ui/react/atoms/button";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getAiUsageStatus } from "@/lib/aiEdit";
import type { AiUsageStatus } from "@/lib/aiQuota";
import { openPortal, type SyncResult, syncCheckout, useBillingStatus } from "@/lib/billing/client";
import type { BillingStatus } from "@/lib/billing/plans";
import { useI18n } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n";
import { loginHref } from "@/lib/useSession";

// プランのページの中身。上から: 購入から戻ったときの知らせ → 今のプラン → 今月の AI → 追加クレジット。
// 解約・支払い方法の変更・月払い ↔ 年払い・領収書は Stripe の顧客ポータルで行う(POST /api/billing/portal)。

export function MyBilling() {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const { status, loading, reload } = useBillingStatus();
  const [usage, setUsage] = useState<AiUsageStatus | null>(null);
  const [synced, setSynced] = useState<SyncResult | "failed" | null>(null);
  const syncing = useRef(false);

  // Checkout から戻ったら、webhook を待たずにその購入を記録に写す。終わったら URL から session_id を消す
  const sessionId = params.get("checkout") === "success" ? params.get("session_id") : null;
  useEffect(() => {
    if (!sessionId || syncing.current) return;
    syncing.current = true;
    void syncCheckout(sessionId).then((result) => {
      setSynced(result?.result ?? "failed");
      reload();
      router.replace(pathname, { scroll: false });
    });
  }, [sessionId, pathname, router, reload]);

  useEffect(() => {
    if (status?.signedIn) void getAiUsageStatus().then(setUsage);
  }, [status]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header showSearch={false} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-sp-md pb-sp-xl pt-10 sm:px-sp-xl">
        <h1 className="text-2xl font-medium text-text-primary">{t.billing.title}</h1>

        {synced && <SyncNotice result={synced} t={t} />}

        {loading && !status ? (
          <p className="text-sm text-text-muted">{t.billing.loading}</p>
        ) : !status?.signedIn ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-text-secondary">{t.billing.loginToSee}</p>
            <a href={loginHref(pathname)} className={buttonVariants({ variant: "primary" })}>
              Sign in
            </a>
          </div>
        ) : (
          <>
            <PlanSection status={status} t={t} />
            {usage && <UsageSection usage={usage} t={t} />}
            <PacksSection status={status} t={t} />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function SyncNotice({ result, t }: { result: SyncResult | "failed"; t: Dictionary }) {
  const text =
    result === "subscription"
      ? t.billing.welcomePro
      : result === "credits"
        ? t.billing.creditsAdded
        : result === "pending"
          ? t.billing.paymentPending
          : t.billing.syncLater;
  const tone = result === "subscription" || result === "credits" ? "bg-status-success-subtle-bg" : "bg-bg-raised";
  return (
    <p role="status" className={`rounded-xl px-4 py-3 text-sm text-text-primary ${tone}`}>
      {text}
    </p>
  );
}

function formatDate(iso: string, t: Dictionary): string {
  return new Date(iso).toLocaleDateString(t.time.intl, { timeZone: "Asia/Tokyo", year: "numeric", month: "long", day: "numeric" });
}

function PlanSection({ status, t }: { status: BillingStatus; t: Dictionary }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sub = status.subscription;
  const activeSub = status.plan === "pro" && sub !== null && !status.operator;

  async function manage() {
    setPending(true);
    setError(null);
    const result = await openPortal(t.billing.portalFailed);
    if (result.ok) {
      window.location.assign(result.url);
      return;
    }
    setError(result.message);
    setPending(false);
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border-subtle px-6 py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-text-secondary">{t.billing.currentPlan}</h2>
        {status.testMode && <span className="text-xs text-text-muted">{t.pricing.testMode}</span>}
      </div>
      <p className="text-2xl font-medium text-text-primary">
        {status.plan === "pro" ? "Pro" : t.pricing.free.name}
        {activeSub && sub.interval && (
          <span className="ml-2 text-sm font-normal text-text-muted">
            {sub.interval === "year" ? t.pricing.yearly : t.pricing.monthly}
          </span>
        )}
      </p>
      {status.operator && <p className="text-sm text-text-secondary">{t.billing.operator}</p>}
      {activeSub && (
        <p className={`text-sm ${sub.status === "past_due" ? "text-danger-solid" : "text-text-secondary"}`}>
          {sub.status === "past_due"
            ? t.billing.pastDue
            : sub.cancelAtPeriodEnd
              ? t.billing.endsOn(formatDate(sub.currentPeriodEnd, t))
              : t.billing.renewsOn(formatDate(sub.currentPeriodEnd, t))}
        </p>
      )}
      {status.plan === "free" && <p className="text-sm text-text-secondary">{t.billing.freeSummary}</p>}
      <div className="flex flex-wrap gap-sp-sm">
        {status.plan === "free" && (
          <Link href="/pricing" className={buttonVariants({ variant: "primary" })}>
            {t.billing.upgrade}
          </Link>
        )}
        {/* 一度でも買った人(Stripe の顧客がいる人)は、領収書や支払い方法をポータルで見られる */}
        {status.configured && (sub !== null || status.packs.length > 0) && (
          <button type="button" onClick={manage} disabled={pending} className={buttonVariants({ variant: "secondary" })}>
            {pending ? t.pricing.redirecting : activeSub ? t.billing.manage : t.billing.receipts}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger-solid">
          {error}
        </p>
      )}
    </section>
  );
}

function UsageSection({ usage, t }: { usage: AiUsageStatus; t: Dictionary }) {
  if (usage.unlimited) return null;
  const monthlyLeft = Math.max(0, usage.credits.limit - usage.credits.used);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-text-secondary">{t.billing.aiThisMonth}</h2>
      <p className="text-sm text-text-primary">
        {t.ai.creditsLeft(monthlyLeft, usage.credits.limit)}
        <span className="ml-2 text-xs text-text-muted">{t.billing.resetsOn(formatDate(usage.monthResetsAt, t))}</span>
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-bg-raised" aria-hidden="true">
        <div
          className="h-full rounded-full bg-accent-default"
          style={{ width: `${Math.min(100, (usage.credits.used / Math.max(1, usage.credits.limit)) * 100)}%` }}
        />
      </div>
      <p className="text-xs text-text-muted">{t.ai.creditsHint}</p>
    </section>
  );
}

function PacksSection({ status, t }: { status: BillingStatus; t: Dictionary }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-text-secondary">{t.billing.packs}</h2>
        <Link href="/pricing#credits" className="text-sm text-text-secondary underline underline-offset-2 hover:text-text-primary">
          {t.ai.buyCredits}
        </Link>
      </div>
      {status.packs.length === 0 ? (
        <p className="text-sm text-text-muted">{t.billing.noPacks}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border-subtle rounded-xl border border-border-subtle">
          {status.packs.map((pack) => (
            <li key={pack.expiresAt + pack.credits} className="flex items-baseline justify-between gap-3 px-4 py-3 text-sm">
              <span className="font-mono text-text-primary">{t.billing.packCredits(pack.credits)}</span>
              <span className="text-text-muted">{t.billing.packExpires(formatDate(pack.expiresAt, t))}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
