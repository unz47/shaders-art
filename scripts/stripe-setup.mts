// Stripe に、shaders.art の商品・価格・顧客ポータルの設定を作る(issue #42)。何度実行しても同じものを 2 つ作らない。
//   STRIPE_SECRET_KEY=sk_test_… node scripts/stripe-setup.mts      … テストモード(まずこちらで試す)
//   STRIPE_SECRET_KEY=sk_live_… node scripts/stripe-setup.mts      … 本番
// 値段は src/lib/billing/plans.ts の PRICES。価格は lookup key で見分ける(サイトも lookup key で引く)。
// 値段を変えるときは、PRICES の lookupKey を新しくしてから実行する(古い価格の契約はそのまま続く)。
// Node 24 は .ts をそのまま実行できる(型を取り除くだけ。plans.ts が import を持たないのはこのため)。
import Stripe from "stripe";
import { PRICES, PRODUCTS } from "../src/lib/billing/plans.ts";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY を指定してください(まずはテストモードの sk_test_…)");
  process.exit(1);
}
const stripe = new Stripe(key);
const live = key.startsWith("sk_live_") || key.startsWith("rk_live_");
console.log(`Stripe の${live ? "本番" : "テスト"}モードに作ります`);

async function ensureProduct(product: { key: string; name: string }): Promise<string> {
  // 検索 API(products.search)は反映に 1 分ほどかかり、作った直後に実行し直すと 2 つ目を作ってしまうので、一覧から探す
  let existing: Stripe.Product | undefined;
  for await (const p of stripe.products.list({ limit: 100 })) {
    if (p.metadata.key === product.key) {
      existing = p;
      break;
    }
  }
  if (existing) {
    console.log(`商品は作成済み: ${product.name} (${existing.id})`);
    return existing.id;
  }
  const created = await stripe.products.create({
    name: product.name,
    metadata: { key: product.key },
    // 日本の消費税の区分(デジタルの役務)。Stripe Tax を使わない限り請求額には影響しない
    tax_code: "txcd_10000000",
  });
  console.log(`商品を作成: ${product.name} (${created.id})`);
  return created.id;
}

const products = { pro: await ensureProduct(PRODUCTS.pro), credits: await ensureProduct(PRODUCTS.credits) };

const existing = await stripe.prices.list({ lookup_keys: Object.values(PRICES).map((p) => p.lookupKey), limit: 10 });
const priceIds: Record<string, string> = {};
for (const price of Object.values(PRICES)) {
  const found = existing.data.find((p) => p.lookup_key === price.lookupKey);
  if (found) {
    console.log(`価格は作成済み: ${price.lookupKey} (${found.id})`);
    priceIds[price.lookupKey] = found.id;
    continue;
  }
  const created = await stripe.prices.create({
    product: price.interval ? products.pro : products.credits,
    lookup_key: price.lookupKey,
    currency: "jpy",
    unit_amount: price.jpy,
    // 表示の額は税込
    tax_behavior: "inclusive",
    // 日本の外の人には米ドルで出す(Checkout が見る人の地域で通貨を選ぶ)
    currency_options: { usd: { unit_amount: price.usdCents, tax_behavior: "inclusive" } },
    ...(price.interval ? { recurring: { interval: price.interval } } : {}),
    metadata: { item: price.item },
  });
  console.log(`価格を作成: ${price.lookupKey} (${created.id})`);
  priceIds[price.lookupKey] = created.id;
}

// 顧客ポータル: 解約(期間の終わりで)・支払い方法の変更・請求の履歴・月払い ↔ 年払いの切り替え
const configs = await stripe.billingPortal.configurations.list({ is_default: true, limit: 1 });
const portal: Stripe.BillingPortal.ConfigurationCreateParams = {
  business_profile: { headline: "shaders.art" },
  features: {
    customer_update: { enabled: true, allowed_updates: ["email"] },
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: {
      enabled: true,
      mode: "at_period_end",
      cancellation_reason: {
        enabled: true,
        options: ["too_expensive", "unused", "missing_features", "switched_service", "other"],
      },
    },
    subscription_update: {
      enabled: true,
      default_allowed_updates: ["price"],
      proration_behavior: "create_prorations",
      products: [
        {
          product: products.pro,
          prices: [priceIds[PRICES["pro-monthly"].lookupKey]!, priceIds[PRICES["pro-yearly"].lookupKey]!],
        },
      ],
    },
  },
};
const current = configs.data[0];
if (current) {
  await stripe.billingPortal.configurations.update(current.id, portal);
  console.log(`顧客ポータルの設定を更新 (${current.id})`);
} else {
  const created = await stripe.billingPortal.configurations.create(portal);
  console.log(`顧客ポータルの設定を作成 (${created.id})`);
}

console.log(`
次にやること:
  1. webhook の宛先を作る(ダッシュボードの「開発者 → Webhook」、または stripe listen でローカルに転送)
     URL: https://<サイト>/api/billing/webhook
     通知: checkout.session.completed, checkout.session.async_payment_succeeded,
           customer.subscription.created, customer.subscription.updated, customer.subscription.deleted,
           customer.subscription.paused, customer.subscription.resumed
  2. 秘密鍵と webhook の署名の鍵(whsec_…)をサイトに渡す(README の「課金」)`);
