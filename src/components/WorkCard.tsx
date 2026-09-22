// Step 1: 1 件ぶんのカードの見た目をここに書く

export interface Work {
  slug: string;
  title: string;
  author: string;
  bytes: number;
  license: string;
}

export function WorkCard({ work }: { work: Work }) {
  return (
    <article className="flex flex-col gap-sp-sm rounded-lg border border-border-subtle bg-bg-base p-sp-md">
      <div className="aspect-[16/10] w-full rounded-lg bg-bg-surface" />
      <h2 className="text-text-primary">{work.title}</h2>
      <p className="text-text-secondary">
        {work.author} / {work.bytes} bytes / {work.license}
      </p>
    </article>
  );
}
