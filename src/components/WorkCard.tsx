import Link from "next/link";
import { Card } from "@frost-ui/react/molecules/card";
import { ShaderThumbnail } from "@/components/ShaderThumbnail";
import type { WorkSummary } from "@/lib/works";

// 仕様: Figma "Home / Desktop 1440" > ShaderCard(node 8:20 ほか)
// サムネ 16:10 相当 + 2 行のキャプション(タイトル…bytes / 作者・年…ライセンス)
export function WorkCard({ work }: { work: WorkSummary }) {
  const year = work.createdAt.slice(0, 4);
  const license = work.license.replace(/-\d.*$/, ""); // "CC0-1.0" → "CC0"

  return (
    <Link href={`/s/${work.slug}/`}>
      <Card className="overflow-hidden rounded-surface border-border-subtle p-0 transition-colors hover:border-border-default">
        <div className="relative aspect-[221/120] w-full">
          <ShaderThumbnail source={work.source} thumbnail={work.thumbnail} alt={work.title} />
        </div>
        <div className="flex flex-col gap-1.5 p-sp-md">
          <div className="flex items-baseline gap-sp-sm">
            <h2 className="flex-1 text-sm font-medium text-text-primary">{work.title}</h2>
            <span className="font-mono text-xs text-text-muted">{work.bytes} B</span>
          </div>
          <div className="flex items-baseline gap-1 text-xs">
            <span className="text-text-secondary">{work.author}</span>
            <span className="flex-1 text-text-muted">· {year}</span>
            <span className="font-mono text-text-muted">{license}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
