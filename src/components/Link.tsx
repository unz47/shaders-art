"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { useLocalize } from "@/lib/i18n/client";

// サイトの中へのリンク。next/link と同じに使え、href をいま見ている言語の URL にする
// (日本語のページでは /learn → /ja/learn。lib/i18n/locale)。サイトの中へのリンクは next/link ではなくこれを使う
export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const localize = useLocalize();
  return <NextLink href={typeof href === "string" ? localize(href) : href} {...props} />;
}
