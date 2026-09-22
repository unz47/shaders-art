import { Badge } from "@frost-ui/react/atoms/badge";
import { Card } from "@frost-ui/react/molecules/card";
import type { Work } from "@/lib/works";

export function WorkCard({ work }: { work: Work }) {
  return (
    <Card className="flex flex-col gap-sp-sm p-0 overflow-hidden">
      <div className="aspect-[16/10] w-full" style={{ background: work.color }} />
      <div className="flex flex-col gap-sp-xs p-sp-md">
        <h2 className="text-text-primary">{work.title}</h2>
        <p className="text-sm text-text-secondary">{work.author}</p>
        <div className="flex items-center gap-sp-xs font-mono text-xs">
          <Badge>{work.bytes} B</Badge>
          <Badge>{work.license}</Badge>
        </div>
      </div>
    </Card>
  );
}
