"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@frost-ui/react/atoms/button";
import moonIcon from "@/icons/moon.svg";
import searchIcon from "@/icons/search.svg";

// 仕様: Figma "Home / Desktop 1440" > Header(node 10:245)
// 全幅 sticky・高さ 64px・下線・左にロゴ+ナビ・右に検索/Submit/テーマ切り替え
// Rooms は行き先が未設計のため削除。Edit(/edit のシェーダーエディタ)は
// まだページが無いので、クリックしても迷子にならないよう見た目だけ残す。
export function Header() {
  // 作品詳細ページ(/s/...)も Gallery の一部として扱い、現在地の下線を出す
  const pathname = usePathname();
  const galleryActive = pathname === "/" || pathname.startsWith("/s/");

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
          <span className="border-b-2 border-transparent pb-1 text-text-secondary">Edit</span>
        </nav>
      </div>

      <div className="ml-auto flex items-center gap-sp-sm">
        <div className="flex h-8 w-60 items-center gap-sp-xs rounded-control border border-border-subtle bg-bg-raised pl-sp-sm pr-1.5">
          <Image src={searchIcon} alt="" width={16} height={16} />
          <span className="text-sm text-text-muted">Search works…</span>
        </div>
        <Button variant="primary" size="sm">
          Submit
        </Button>
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
      </div>
    </header>
  );
}
