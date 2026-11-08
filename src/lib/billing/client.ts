"use client";

import { useCallback, useEffect, useState } from "react";
import type { BillingStatus, CheckoutItem } from "./plans";

// ブラウザから課金の API(/api/billing/*)を呼ぶ。料金ページ・プランのページ・Learn の Pro の回で使う。

export async function getBillingStatus(): Promise<BillingStatus | null> {
  try {
    const res = await fetch("/api/billing/status", { cache: "no-store" });
    return res.ok ? ((await res.json()) as BillingStatus) : null;
  } catch {
    return null;
  }
}

/** 状態を読む。reload で読み直せる(購入から戻ったとき・契約の管理画面から戻ったとき) */
export function useBillingStatus(): { status: BillingStatus | null; loading: boolean; reload: () => void } {
  const [state, setState] = useState<{ status: BillingStatus | null; loading: boolean }>({ status: null, loading: true });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    void getBillingStatus().then((status) => {
      if (!cancelled) setState({ status, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [version]);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}

type UrlResult = { ok: true; url: string } | { ok: false; message: string };

async function postForUrl(path: string, body: unknown, fallback: string): Promise<UrlResult> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as { url?: string; message?: string } | null;
    if (res.ok && data?.url) return { ok: true, url: data.url };
    return { ok: false, message: data?.message ?? fallback };
  } catch {
    return { ok: false, message: fallback };
  }
}

/** Stripe Checkout の URL を作ってもらう。成功したら呼ぶ側がそこへ移る */
export function startCheckout(item: CheckoutItem, fallback: string): Promise<UrlResult> {
  return postForUrl("/api/billing/checkout", { item }, fallback);
}

/** Stripe の顧客ポータル(解約・支払い方法の変更・領収書)の URL を作ってもらう */
export function openPortal(fallback: string): Promise<UrlResult> {
  return postForUrl("/api/billing/portal", {}, fallback);
}

export type SyncResult = "subscription" | "credits" | "pending" | "ignored";

/** Checkout から戻ったとき、その購入を記録に写してもらう(webhook を待たずに Pro にする) */
export async function syncCheckout(sessionId: string): Promise<{ result: SyncResult; status: BillingStatus } | null> {
  try {
    const res = await fetch("/api/billing/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    return res.ok ? ((await res.json()) as { result: SyncResult; status: BillingStatus }) : null;
  } catch {
    return null;
  }
}
