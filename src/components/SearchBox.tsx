"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef } from "react";
import { Kbd } from "@frost-ui/react/atoms/kbd";
import searchIcon from "@/icons/search.svg";
import { parseQuery, SEARCH_QUERY_MAX, worksHref, type WorksSort } from "@/lib/worksQuery";

// 作品の検索欄(ヘッダーと /works)。送ると /works?q=… に移る。検索語が空ならすべての作品。
// 入力のたびではなく、送ったときに検索する。何をどう探すかは lib/worksQuery の matchesQuery。
// shortcut を付けると、ほかの入力欄にいないときに「/」でここに移れる(YouTube や GitHub と同じ)。
export function SearchBox({
  defaultValue = "",
  sort = "new",
  shortcut = false,
}: {
  defaultValue?: string;
  /** 送ったときの並び順(/works で並べ替えた状態から探し直すとき用) */
  sort?: WorksSort;
  shortcut?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!shortcut) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const input = inputRef.current;
      // 狭い画面で隠れているときは何もしない
      if (!input || input.offsetParent === null) return;
      event.preventDefault();
      input.focus();
      input.select();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcut]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(worksHref({ sort, q: parseQuery(inputRef.current?.value) }));
  }

  return (
    // JavaScript が動かないときも、そのまま /works?q=… に送れるようにしておく
    <form
      role="search"
      action="/works"
      onSubmit={handleSubmit}
      className="flex h-8 items-center gap-sp-xs rounded-control border border-border-subtle bg-bg-raised pl-sp-sm pr-1.5 focus-within:border-border-strong"
    >
      <Image src={searchIcon} alt="" width={16} height={16} />
      <input
        ref={inputRef}
        type="search"
        name="q"
        defaultValue={defaultValue}
        maxLength={SEARCH_QUERY_MAX}
        placeholder="Search works…"
        aria-label="作品を検索"
        enterKeyHint="search"
        className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
      />
      {shortcut && <Kbd aria-hidden="true">/</Kbd>}
    </form>
  );
}
