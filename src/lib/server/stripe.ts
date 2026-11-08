import { GetParametersCommand, SSMClient } from "@aws-sdk/client-ssm";
import Stripe from "stripe";
import { type CheckoutItem, PRICES } from "../billing/plans";

// Stripe の設定(issue #42)。秘密鍵と webhook の署名の鍵は、
//   ローカル … .env.local の STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET(テストモードの鍵)
//   本番   … SSM パラメータストアの SecureString(STRIPE_SSM_PREFIX の下の secret-key / webhook-secret)
// から読む。本番で Lambda の環境変数に直接入れないのは、CloudFormation のテンプレートに鍵が残るため。
// どちらも無ければ課金は「未設定」として扱い、料金ページは買うボタンを出さない(Pro の判定は記録だけで動く)。

export interface StripeConfig {
  stripe: Stripe;
  webhookSecret: string | null;
  /** テストモードの鍵(sk_test_…)か。画面に「テスト中」と出すのに使う */
  testMode: boolean;
}

const NOT_CONFIGURED_RETRY_MS = 5 * 60 * 1000;
let cached: { config: StripeConfig | null; at: number } | null = null;
let loading: Promise<StripeConfig | null> | null = null;

export async function getStripeConfig(): Promise<StripeConfig | null> {
  // 設定があれば Lambda のインスタンスが生きている間は使い回す。無ければ 5 分おきに読み直す(後から入れたとき用)
  if (cached && (cached.config || Date.now() - cached.at < NOT_CONFIGURED_RETRY_MS)) return cached.config;
  loading ??= loadStripeConfig()
    .catch((error: unknown) => {
      console.error("[stripe] config", error);
      return null;
    })
    .then((config) => {
      cached = { config, at: Date.now() };
      loading = null;
      return config;
    });
  return loading;
}

async function loadStripeConfig(): Promise<StripeConfig | null> {
  const fromEnv = process.env.STRIPE_SECRET_KEY;
  if (fromEnv) return toConfig(fromEnv, process.env.STRIPE_WEBHOOK_SECRET || null);

  const prefix = process.env.STRIPE_SSM_PREFIX;
  if (!prefix) return null;
  const names = { secretKey: `${prefix}/secret-key`, webhookSecret: `${prefix}/webhook-secret` };
  const { Parameters = [] } = await new SSMClient({}).send(
    new GetParametersCommand({ Names: Object.values(names), WithDecryption: true }),
  );
  const value = (name: string) => Parameters.find((p) => p.Name === name)?.Value || null;
  const secretKey = value(names.secretKey);
  if (!secretKey) return null;
  return toConfig(secretKey, value(names.webhookSecret));
}

function toConfig(secretKey: string, webhookSecret: string | null): StripeConfig {
  // API のバージョンは SDK に固定されたもの(stripe@23 なら 2026-09-30)。SDK を上げるときに合わせて確かめる
  const stripe = new Stripe(secretKey, { appInfo: { name: "shaders.art" }, maxNetworkRetries: 2 });
  return { stripe, webhookSecret, testMode: secretKey.startsWith("sk_test_") || secretKey.startsWith("rk_test_") };
}

const PRICE_CACHE_MS = 10 * 60 * 1000;
let priceCache: { ids: Map<string, string>; at: number } | null = null;

/** 買うものの Stripe の価格 ID。lookup key で引く(価格 ID を環境変数で持たずに済むように)。無ければ null */
export async function priceIdFor(config: StripeConfig, item: CheckoutItem): Promise<string | null> {
  if (!priceCache || Date.now() - priceCache.at > PRICE_CACHE_MS) {
    const { data } = await config.stripe.prices.list({
      lookup_keys: Object.values(PRICES).map((p) => p.lookupKey),
      active: true,
      limit: 10,
    });
    priceCache = { ids: new Map(data.flatMap((p) => (p.lookup_key ? [[p.lookup_key, p.id] as const] : []))), at: Date.now() };
  }
  return priceCache.ids.get(PRICES[item].lookupKey) ?? null;
}
