"use client";

import Link from "@/components/Link";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useI18n } from "@/lib/i18n/client";

// 仕様: Figma "Home / Desktop 1440" > Footer / Statement(node 10:263)
// Licenses と Terms は利用規約(/terms)、Privacy はプライバシーポリシー(/privacy)、Pricing は料金(/pricing)、
// その隣は特定商取引法に基づく表記へのリンク。ほかはまだ見た目だけ。右に言語の切り替え(English / 日本語)
export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="px-sp-xl pb-sp-xl pt-24">
      <div className="flex flex-wrap items-baseline gap-x-sp-md gap-y-sp-xs border-t border-border-subtle pt-sp-sm">
        <div className="flex items-baseline gap-sp-xs whitespace-nowrap">
          <span className="text-sm font-medium text-text-primary">shaders.art</span>
          <span className="text-xs tracking-wide text-text-muted">a museum of fragment shaders</span>
        </div>
        <div className="flex-1" />
        <div className="flex flex-wrap items-baseline gap-x-sp-md gap-y-sp-xs text-sm">
          <span className="text-text-secondary">GitHub</span>
          <span className="text-text-secondary">Submit</span>
          <Link href="/pricing" className="text-text-secondary hover:text-text-primary">
            Pricing
          </Link>
          <Link href="/terms#license" className="text-text-secondary hover:text-text-primary">
            Licenses
          </Link>
          <Link href="/terms" className="text-text-secondary hover:text-text-primary">
            Terms
          </Link>
          <Link href="/privacy" className="text-text-secondary hover:text-text-primary">
            Privacy
          </Link>
          <Link href="/legal/commerce" className="text-text-secondary hover:text-text-primary">
            {t.footer.commerce}
          </Link>
          <LanguageSwitch />
          <span className="text-xs tracking-wide text-text-muted">© 2026 shaders.art</span>
        </div>
      </div>
    </footer>
  );
}
