// 有料プラン(Pro)と追加クレジットの定義(issue #42)。料金ページ(ブラウザ)、Route Handler(サーバー)、
// Stripe に商品と価格を作るスクリプト(scripts/stripe-setup.mts)で共有する。
// スクリプトが Node の型の取り除き(strip-types)で読むので、import を持たない素の TypeScript にしておく。
//
// 方針(#42): 閲覧・編集・投稿・配信背景は無料のまま。Learn の全 30 回も無料。原価がかかる AI にだけ値段を付ける。
//   無料 … AI 月 40 クレジット・1 日 20 回。Qwen などのモデルだけ
//   Pro  … AI 月 600 クレジット・1 日 100 回。Claude も選べる
//   追加クレジット … 500 クレジット。発行から 6 か月で失効(資金決済法の前払式支払手段の対象外にするため)
// 実際に請求する額は Stripe の価格(lookup key で引く)が正。ここの額は画面に出す表示用で、
// スクリプトが Stripe に価格を作るときにも使うので、両者は同じ値になる。値段を変えるときは新しい lookup key で作り直す。

/** Checkout で買えるもの。API(POST /api/billing/checkout)が受け付ける値 */
export const CHECKOUT_ITEMS = ["pro-monthly", "pro-yearly", "credits-500"] as const;
export type CheckoutItem = (typeof CHECKOUT_ITEMS)[number];

export function isCheckoutItem(value: unknown): value is CheckoutItem {
  return typeof value === "string" && (CHECKOUT_ITEMS as readonly string[]).includes(value);
}

export interface PriceDefinition {
  item: CheckoutItem;
  /** Stripe の価格の lookup key。値段を変えたら新しい key にする(古い価格の契約はそのまま続く) */
  lookupKey: string;
  /** 日本円(税込) */
  jpy: number;
  /** 日本の外の人向けの米ドル(税込、セント)。Checkout が見る人の地域で通貨を選ぶ */
  usdCents: number;
  /** 定期払いなら月か年。追加クレジットは 1 回払い */
  interval: "month" | "year" | null;
}

export const PRICES: Record<CheckoutItem, PriceDefinition> = {
  "pro-monthly": { item: "pro-monthly", lookupKey: "pro_monthly_jpy600", jpy: 600, usdCents: 400, interval: "month" },
  // 年払いは 2 か月分の割引。1 年後に続けている人の割合が月払いの約 3 倍で、代金も先に入る(#42)
  "pro-yearly": { item: "pro-yearly", lookupKey: "pro_yearly_jpy6000", jpy: 6000, usdCents: 4000, interval: "year" },
  "credits-500": { item: "credits-500", lookupKey: "credits_500_jpy500", jpy: 500, usdCents: 350, interval: null },
};

/** Stripe の商品(Product)の識別子。スクリプトが同じ商品を 2 つ作らないように使う */
export const PRODUCTS = {
  pro: { key: "shaders_art_pro", name: "shaders.art Pro" },
  credits: { key: "shaders_art_ai_credits", name: "shaders.art AI credits" },
} as const;

/** 追加クレジット 1 回ぶんの量と、有効期限(発行から何か月か)。6 か月を超えると資金決済法の届出が要りうる */
export const CREDIT_PACK = { credits: 500, validMonths: 6 } as const;

/** Pro の AI の上限の既定(環境変数 AI_PRO_MONTHLY_CREDITS / AI_PRO_DAILY_REQUESTS で変えられる) */
export const DEFAULT_PRO_MONTHLY_CREDITS = 600;
export const DEFAULT_PRO_DAILY_REQUESTS = 100;

export type Plan = "free" | "pro";

/** GET /api/billing/status の応答。料金ページ・プランのページ・AI 欄が使う */
export interface BillingStatus {
  /** サーバーに Stripe の設定があるか。無ければ買うボタンを出さない */
  configured: boolean;
  /** Stripe のテストモードか(料金ページに「テスト中」と出す) */
  testMode: boolean;
  /** ログインしているか */
  signedIn: boolean;
  plan: Plan;
  /** 運営など、払わなくても Pro と同じに使える人 */
  operator: boolean;
  subscription: {
    interval: "month" | "year" | null;
    /** Stripe の状態(active / trialing / past_due / canceled など) */
    status: string;
    /** 今の期間が終わる時刻(ISO)。自動で更新されるなら次の請求日 */
    currentPeriodEnd: string;
    /** 期間の終わりで解約される(自動更新を止めた)か */
    cancelAtPeriodEnd: boolean;
  } | null;
  /** 使える追加クレジット(期限の早い順)。使い切ったもの・期限が切れたものは含めない */
  packs: { credits: number; expiresAt: string }[];
}

/** 画面に出す日本円(税込)。例: ¥6,000 */
export function formatJpy(amount: number): string {
  return `¥${amount.toLocaleString("en-US")}`;
}

/** 画面に出す米ドル。例: US$4 / US$3.50 */
export function formatUsd(cents: number): string {
  return `US$${cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2)}`;
}
