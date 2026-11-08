"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { buttonVariants } from "@frost-ui/react/atoms/button";
import { getBillingStatus } from "@/lib/billing/client";
import { useI18n } from "@/lib/i18n/client";
import { loginHref, useSession } from "@/lib/useSession";

// Pro の回の案内の中に置く。サーバーは ID トークンの期限が切れていると Pro と分からない(lib/server/viewer)ので、
// ログインしている人なら課金の状態を API で読み直し(このときクッキーが新しくなる)、Pro なら本文を描き直す。
// 描き直しても Pro と分からなかったときに繰り返さないよう、1 回のページの読み込みにつき 1 回だけ試す。
// ログインしていない人には「ログイン」を出す(Pro の人がログインし忘れている場合のため)。

const rechecked = new Set<string>();

export function ProRecheck({ slug }: { slug: string }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const signedIn = session.status === "ready" && session.user !== null;

  useEffect(() => {
    if (!signedIn || rechecked.has(slug)) return;
    rechecked.add(slug);
    void getBillingStatus().then((status) => {
      if (status?.plan === "pro") router.refresh();
    });
  }, [signedIn, slug, router]);

  if (session.status !== "ready" || !session.configured || signedIn) return null;
  return (
    <a href={loginHref(pathname)} className={buttonVariants({ variant: "ghost" })}>
      {t.learn.pro.login}
    </a>
  );
}
