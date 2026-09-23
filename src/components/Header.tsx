import Image from "next/image";
import Link from "next/link";
import { Button } from "@frost-ui/react/atoms/button";
import moonIcon from "@/icons/moon.svg";
import searchIcon from "@/icons/search.svg";

// 仕様: Figma "Home / Desktop 1440" > Header(node 10:245)
// 全幅 sticky・高さ 64px・下線・左にロゴ+ナビ・右に検索/Submit/テーマ切り替え
// Rooms/Edit はまだページが無いので、クリックしても迷子にならないよう
// 見た目だけ残してリンク化しない。ロゴと Gallery だけ Home に戻れるようにする。
export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-sp-md border-b border-border-subtle bg-bg-base px-sp-xl backdrop-blur">
      <div className="flex items-center gap-sp-xl">
        <Link href="/" className="flex items-center gap-sp-xs pl-1">
          <span className="h-[2px] w-3.5 bg-accent-default" />
          <span className="text-sm font-medium text-text-primary">shaders.art</span>
        </Link>
        <nav className="flex items-center gap-sp-md text-sm">
          <Link href="/" className="text-text-primary">
            Gallery
          </Link>
          <span className="text-text-secondary">Rooms</span>
          <span className="text-text-secondary">Edit</span>
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
        <button className="flex size-8 items-center justify-center rounded-control border border-border-subtle bg-bg-base">
          <Image src={moonIcon} alt="テーマ切り替え" width={16} height={16} />
        </button>
      </div>
    </header>
  );
}
