import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { COMMERCE_INFO } from "@/lib/billing/commerce";
import { CREDIT_PACK, formatJpy, PRICES } from "@/lib/billing/plans";
import { getLocale } from "@/lib/i18n/server";

// /legal/commerce … 特定商取引法に基づく表記(issue #42)。有料プランを売るので必須。
// 日本の法律の表記なので日本語が正文。英語で見ている人には同じ内容の英訳を出す。
// 運営者の情報は lib/billing/commerce(本番で売る前に埋める)。

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title:
      locale === "ja"
        ? "特定商取引法に基づく表記 — shaders.art"
        : "Notice under the Act on Specified Commercial Transactions — shaders.art",
  };
}

const ON_REQUEST = { ja: "請求があった場合は、遅滞なく開示します", en: "Disclosed without delay upon request" };
const NOT_SET = { ja: "準備中", en: "Coming soon" };

export default async function CommercePage() {
  const locale = await getLocale();
  const ja = locale === "ja";
  const info = COMMERCE_INFO;
  const orRequest = (value: string | null) => value ?? ON_REQUEST[locale];
  const rows: [string, string][] = ja
    ? [
        ["販売事業者", orRequest(info.seller)],
        ["運営統括責任者", orRequest(info.manager)],
        ["所在地", orRequest(info.address)],
        ["電話番号", orRequest(info.phone)],
        ["メールアドレス", info.email ?? NOT_SET.ja],
        [
          "販売価格(税込)",
          `Pro 月払い ${formatJpy(PRICES["pro-monthly"].jpy)} / 月、Pro 年払い ${formatJpy(PRICES["pro-yearly"].jpy)} / 年、追加クレジット ${CREDIT_PACK.credits} クレジット ${formatJpy(PRICES["credits-500"].jpy)}。日本の外からのお支払いは、料金ページに記載の米ドルの価格になります。`,
        ],
        ["商品代金以外の必要料金", "インターネットの接続料金・通信料金はお客様のご負担です。"],
        ["お支払い方法", "クレジットカード(決済は Stripe が行います)"],
        [
          "お支払いの時期",
          "Pro は申し込みのときに初回分をお支払いいただき、以後は契約の期間(1 か月または 1 年)ごとに自動で更新し、更新の日にお支払いいただきます。追加クレジットは購入のときにお支払いいただきます。",
        ],
        ["引き渡しの時期", "お支払いが済んだ時点から、すぐにお使いいただけます。"],
        [
          "解約・返品・キャンセル",
          "Pro は「プランと支払い」のページからいつでも解約できます。解約しても、お支払い済みの期間の終わりまでは Pro のままお使いいただけ、次の更新から請求されません。デジタルの役務という性質上、お支払い後の返金・キャンセル(日割りの返金を含む)はお受けしていません。ただし、法令で認められる場合や、本サービスの不具合で利用できなかった場合はこの限りではありません。",
        ],
        [
          "追加クレジットの有効期限",
          `発行(お支払いが済んだ時点)から ${CREDIT_PACK.validMonths} か月です。期限を過ぎた分は使えなくなり、払い戻しはしません。`,
        ],
        ["動作環境", "WebGL2 に対応した最新のブラウザ(Chrome・Safari・Firefox・Edge)"],
      ]
    : [
        ["Seller", orRequest(info.seller)],
        ["Person in charge", orRequest(info.manager)],
        ["Address", orRequest(info.address)],
        ["Phone", orRequest(info.phone)],
        ["Email", info.email ?? NOT_SET.en],
        [
          "Prices (tax included)",
          `Pro monthly ${formatJpy(PRICES["pro-monthly"].jpy)} / month, Pro yearly ${formatJpy(PRICES["pro-yearly"].jpy)} / year, extra credits: ${CREDIT_PACK.credits} credits for ${formatJpy(PRICES["credits-500"].jpy)}. Payments from outside Japan are charged the US dollar prices shown on the pricing page.`,
        ],
        ["Other charges", "Internet connection and data charges are paid by the customer."],
        ["Payment method", "Credit card (processed by Stripe)"],
        [
          "Payment timing",
          "Pro is paid when you sign up, then renews automatically every billing period (1 month or 1 year) and is charged on the renewal date. Extra credits are paid at purchase.",
        ],
        ["Delivery", "Available immediately after payment."],
        [
          "Cancellation and refunds",
          "You can cancel Pro at any time from the Plan & billing page. You keep Pro until the end of the period you have paid for, and you are not charged again. Because this is a digital service, payments are not refundable (including prorated refunds), except where required by law or when the service could not be used because of a fault on our side.",
        ],
        [
          "Expiry of extra credits",
          `${CREDIT_PACK.validMonths} months from issue (when payment completes). Expired credits cannot be used and are not refunded.`,
        ],
        ["Supported browsers", "Recent browsers with WebGL2 (Chrome, Safari, Firefox, Edge)"],
      ];

  return (
    <div className="flex min-h-dvh flex-col">
      <Header showSearch={false} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-sp-md pt-10 sm:px-sp-xl">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-medium text-text-primary">
            {ja ? "特定商取引法に基づく表記" : "Notice under the Act on Specified Commercial Transactions"}
          </h1>
          {!ja && (
            <p className="text-sm leading-7 text-text-secondary">
              This is a translation of the Japanese notice required by Japanese law. The Japanese version prevails.
            </p>
          )}
        </div>
        <dl className="divide-y divide-border-subtle border-y border-border-subtle">
          {rows.map(([term, description]) => (
            <div key={term} className="grid gap-1 py-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6">
              <dt className="text-sm font-medium text-text-primary">{term}</dt>
              <dd className="text-sm leading-7 text-text-secondary">{description}</dd>
            </div>
          ))}
        </dl>
        <p className="flex flex-wrap gap-x-sp-md text-sm">
          <Link href="/pricing" className="text-text-secondary underline underline-offset-2 hover:text-text-primary">
            {ja ? "料金" : "Pricing"}
          </Link>
          <Link href="/terms#paid" className="text-text-secondary underline underline-offset-2 hover:text-text-primary">
            {ja ? "利用規約(有料プラン)" : "Terms of Service (paid plans)"}
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
