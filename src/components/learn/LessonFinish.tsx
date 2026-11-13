"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@frost-ui/react/atoms/button";
import { useI18n } from "@/lib/i18n/client";
import type { LessonLink } from "@/lib/learn/localize";
import { setLessonDone, useLessonsDone } from "@/lib/learn/progress";

// レッスンの最後の「この回を終える」。終えた回は目次(/learn)に印が付き、「続きから」の行き先も進む。
export function LessonFinish({ slug, next }: { slug: string; next: LessonLink | null }) {
  const { t } = useI18n();
  const done = useLessonsDone();
  const finished = done?.includes(slug) ?? false;

  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-border-subtle p-5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-medium text-text-primary">
          {finished ? `✓ ${t.learn.finished}` : next ? t.learn.finishNote : t.learn.lastLesson}
        </p>
        {finished && next && (
          <p className="text-sm text-text-secondary">
            {t.learn.next}: {t.learn.lessonNumber(next.number)} {next.title}
          </p>
        )}
      </div>
      {/* サーバーとハイドレーションの間は進み具合が分からないので、ボタンを出さない(押せない状態を見せない) */}
      {done !== null &&
        (finished ? (
          <div className="flex items-center gap-sp-xs">
            <Button variant="ghost" size="sm" onClick={() => setLessonDone(slug, false)}>
              {t.learn.undoFinish}
            </Button>
            {next && (
              <Link href={`/learn/${next.slug}`} className={buttonVariants({ variant: "primary", size: "md" })}>
                {t.learn.next} →
              </Link>
            )}
          </div>
        ) : (
          <Button variant="primary" onClick={() => setLessonDone(slug, true)}>
            {t.learn.finish}
          </Button>
        ))}
    </div>
  );
}
