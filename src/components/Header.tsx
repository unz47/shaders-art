"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Avatar } from "@frost-ui/react/atoms/avatar";
import { buttonVariants } from "@frost-ui/react/atoms/button";
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@frost-ui/react/organisms/menu";
import { avatarBackground, avatarInitial } from "@/lib/avatar";
import { loginHref, type SessionUser, useSession } from "@/lib/useSession";
import moonIcon from "@/icons/moon.svg";
import searchIcon from "@/icons/search.svg";

// 仕様: Figma "Home / Desktop 1440" > Header(node 10:245)
// 全幅 sticky・高さ 64px・下線・左にロゴ+ナビ・右に検索/Submit/テーマ切り替え
// Rooms は行き先が未設計のため削除。
// 投稿にはログインが要る(2026-09-27 の方針)。未ログインなら Sign in、ログイン中なら
// Submit(/edit へ)とアバター(押すとメールアドレス・自分の作品・Sign out のメニュー)を出す。
// Sign in とアバターは一番右に置く。閲覧はログイン不要。
export function Header({ showSearch = true, showSubmit = true }: { showSearch?: boolean; showSubmit?: boolean }) {
  // 作品詳細ページ(/s/...)も Gallery の一部として扱い、現在地の下線を出す
  const pathname = usePathname();
  const galleryActive = pathname === "/" || pathname.startsWith("/s/");
  const editActive = pathname.startsWith("/edit");
  const session = useSession();

  // 初期値は layout.tsx の先読みスクリプトが既に適用した data-theme から読む
  // (SSR時は document が無いので light 決め打ち。ずれても下の suppressHydrationWarning で吸収)
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" && document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // プライベートブラウジングなどで localStorage が使えなくても、切り替え自体は動かす
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-sp-md border-b border-border-subtle bg-bg-base px-sp-xl backdrop-blur">
      <div className="flex items-center gap-sp-xl">
        <Link href="/" className="flex items-center gap-sp-xs pl-1 transition-colors hover:opacity-70">
          <span className="h-[2px] w-3.5 bg-accent-default" />
          <span className="font-serif text-lg italic tracking-tight text-text-primary">shaders.art</span>
        </Link>
        <nav className="flex items-center gap-sp-md text-sm">
          <Link
            href="/"
            className={`border-b-2 pb-1 text-text-primary transition-colors hover:text-accent-default ${
              galleryActive ? "border-accent-default" : "border-transparent"
            }`}
          >
            Gallery
          </Link>
          <Link
            href="/edit"
            className={`border-b-2 pb-1 text-text-primary transition-colors hover:text-accent-default ${
              editActive ? "border-accent-default" : "border-transparent"
            }`}
          >
            Edit
          </Link>
        </nav>
      </div>

      <div className="ml-auto flex items-center gap-sp-sm">
        {showSearch && (
          <div className="flex h-8 w-60 items-center gap-sp-xs rounded-control border border-border-subtle bg-bg-raised pl-sp-sm pr-1.5">
            <Image src={searchIcon} alt="" width={16} height={16} />
            <span className="text-sm text-text-muted">Search works…</span>
          </div>
        )}
        {showSubmit && session.status === "ready" && session.user && (
          <Link href="/edit" className={buttonVariants({ variant: "primary", size: "sm" })}>
            Submit
          </Link>
        )}
        <button
          onClick={toggleTheme}
          aria-pressed={theme === "dark"}
          suppressHydrationWarning
          className={`flex size-8 items-center justify-center rounded-control border border-border-subtle transition-colors ${
            theme === "dark" ? "bg-bg-raised" : "bg-bg-base"
          }`}
        >
          <Image src={moonIcon} alt="ダークモード切り替え" width={16} height={16} />
        </button>
        {session.status === "ready" && session.user && <AccountMenu user={session.user} />}
        {session.status === "ready" && session.configured && !session.user && (
          // Route Handler へのフルページ遷移なので <Link> ではなく <a>
          <a href={loginHref(pathname)} className={buttonVariants({ variant: "primary", size: "sm" })}>
            Sign in
          </a>
        )}
      </div>
    </header>
  );
}

function AccountMenu({ user }: { user: SessionUser }) {
  // ログアウトは POST(GET だとプリフェッチなどで勝手に発火しうる)。メニューの中身は
  // ポップアップとして別の場所に描かれるので、フォームはメニューの外に置いて送る
  const logoutForm = useRef<HTMLFormElement>(null);

  return (
    <>
      <form ref={logoutForm} action="/api/auth/logout" method="post" hidden />
      <Menu>
        <MenuTrigger
          aria-label="アカウント"
          className="rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-default"
        >
          <Avatar
            size="sm"
            fallback={avatarInitial(user.email)}
            className="text-white"
            style={{ backgroundImage: avatarBackground(user.email) }}
          />
        </MenuTrigger>
        <MenuContent align="end">
          <MenuGroup>
            <MenuGroupLabel>ログイン中</MenuGroupLabel>
            <div className="max-w-64 truncate px-sp-sm pb-sp-xs text-sm text-text-primary">
              {user.email ?? "メールアドレス未設定"}
            </div>
          </MenuGroup>
          <MenuSeparator />
          <MenuItem render={<Link href="/me" />}>自分の作品</MenuItem>
          <MenuItem onClick={() => logoutForm.current?.requestSubmit()}>Sign out</MenuItem>
        </MenuContent>
      </Menu>
    </>
  );
}
