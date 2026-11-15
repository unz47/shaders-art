"use client";

import { usePathname } from "next/navigation";
import { type MouseEvent, useState } from "react";
import { Button } from "@frost-ui/react/atoms/button";
import { useToast } from "@frost-ui/react/organisms/toast";
import { HeartIcon } from "@/components/HeartIcon";
import { useI18n } from "@/lib/i18n/client";
import { favoriteCountOf, toggleFavorite, useFavorites } from "@/lib/useFavorites";
import { loginHref, useSession } from "@/lib/useSession";
import type { WorkSummary } from "@/lib/works";

// お気に入りの ♡ ボタン。ログインしていなければ、押すとログイン画面へ(戻ってきたら同じページ)。
// サーバーにログインの設定が無いとき(ローカルで Cognito に繋いでいない等)は出さない。
//   overlay … カードのサムネの右上。ホバーしたとき(タッチの端末では常に)とお気に入りのときに出す
//   inline  … 作品ページのツールバー。数も並べる

export function FavoriteButton({
  work,
  variant,
}: {
  work: Pick<WorkSummary, "slug" | "favoriteCount">;
  variant: "overlay" | "inline";
}) {
  const session = useSession();
  const favorites = useFavorites();
  const pathname = usePathname();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const { t } = useI18n();

  if (session.status !== "ready" || !session.configured) return null;

  const favorited = favorites.status === "ready" && favorites.favorited.has(work.slug);
  const label = favorited ? t.favorite.remove : t.favorite.add;

  async function onClick(event: MouseEvent) {
    // カードやタイルの上に重ねて置くので、下のリンク(作品ページへの移動)に伝えない
    event.preventDefault();
    event.stopPropagation();
    if (session.status !== "ready" || !session.user) {
      // Route Handler へのフルページ遷移
      window.location.assign(loginHref(pathname));
      return;
    }
    if (favorites.status !== "ready" || busy) return;
    setBusy(true);
    try {
      await toggleFavorite(work.slug);
    } catch {
      toast.add({ title: t.favorite.failed, description: t.favorite.retryLater, priority: "high" });
    } finally {
      setBusy(false);
    }
  }

  if (variant === "overlay") {
    return (
      <button
        type="button"
        aria-label={label}
        aria-pressed={favorited}
        onClick={onClick}
        className={`absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-opacity hover:bg-black/60 focus-visible:opacity-100 pointer-coarse:opacity-100 ${
          favorited ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <HeartIcon filled={favorited} className="size-4" />
      </button>
    );
  }

  return (
    <Button variant="ghost" size="sm" aria-label={label} aria-pressed={favorited} onClick={onClick} disabled={busy}>
      <HeartIcon filled={favorited} className={`size-4 ${favorited ? "text-accent-default" : ""}`} />
      <span className="font-mono">{favoriteCountOf(work, favorites)}</span>
    </Button>
  );
}

/** 「♡ 12」の表示だけ(押せない)。0 のときは出さない */
export function FavoriteCount({
  work,
  className = "",
}: {
  work: Pick<WorkSummary, "slug" | "favoriteCount">;
  className?: string;
}) {
  const favorites = useFavorites();
  const { t } = useI18n();
  const count = favoriteCountOf(work, favorites);
  if (count <= 0) return null;
  return (
    <span className={`inline-flex items-center gap-1 font-mono ${className}`}>
      <HeartIcon filled className="size-3" />
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">{t.favorite.countLabel(count)}</span>
    </span>
  );
}
