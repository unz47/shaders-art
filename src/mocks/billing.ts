import { http, HttpResponse } from "msw";
import type { BillingStatus } from "@/lib/billing/plans";

// 課金の状態の偽物。モックでは Stripe に繋がないので「準備中」(買うボタンを出さない)にする
export const billingStatus = http.get("/api/billing/status", () =>
  HttpResponse.json({
    configured: false,
    testMode: false,
    signedIn: true,
    plan: "free",
    operator: false,
    subscription: null,
    packs: [],
  } satisfies BillingStatus),
);
