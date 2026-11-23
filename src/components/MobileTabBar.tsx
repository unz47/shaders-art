"use client";

import Link from "@/components/Link";
import { EditIcon, GalleryIcon, LearnIcon, SearchIcon } from "@/components/icons";
import { usePagePath } from "@/lib/i18n/client";

// スマホ幅(sm 未満)だけ、画面の下に出すタブバー。親指で 1 回押せば行き来できるようにする
// (ヘッダーの「≡」メニューだと 2 回押す必要があった)。
// 高さは globals.css の --tabbar-h。ページの下が隠れないよう、body の下の余白と
// 画面いっぱいのページ(/edit・/s/...)の高さはこの値の分だけ減らしている。
const TABS = [
  { href: "/", label: "Gallery", Icon: GalleryIcon, match: (p: string) => p === "/" || p.startsWith("/s/") },
  { href: "/works", label: "Search", Icon: SearchIcon, match: (p: string) => p.startsWith("/works") },
  { href: "/edit", label: "Edit", Icon: EditIcon, match: (p: string) => p.startsWith("/edit") },
  { href: "/learn", label: "Learn", Icon: LearnIcon, match: (p: string) => p.startsWith("/learn") },
] as const;

export function MobileTabBar() {
  const pathname = usePagePath();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-border-subtle bg-bg-base pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      {TABS.map(({ href, label, Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex h-14 flex-col items-center justify-center gap-1 text-[11px] transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-default ${
              active ? "text-accent-default" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
