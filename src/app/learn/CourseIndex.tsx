"use client";

import Link from "next/link";
import { buttonVariants } from "@frost-ui/react/atoms/button";
import { Progress } from "@frost-ui/react/atoms/progress";
import { ShaderThumbnail } from "@/components/ShaderThumbnail";
import { useI18n } from "@/lib/i18n/client";
import type { CourseOutline } from "@/lib/learn/localize";
import { useLessonsDone } from "@/lib/learn/progress";

// 目次の中身。上に題名・説明・「始める / 続きから」と進み具合、その下に部ごとのレッスンのカード。
// カードの絵は、その回の課題の見本(一覧のサムネと同じく、画面に入ったら 1 コマ描き、ホバーで動かす)。
export function CourseIndex({ course }: { course: CourseOutline }) {
  const { t } = useI18n();
  const done = useLessonsDone();
  const lessons = course.parts.flatMap((part) => part.lessons);
  const doneCount = done === null ? 0 : lessons.filter((lesson) => done.includes(lesson.slug)).length;
  // 「続きから」は、まだ終えていない回のうち、本文のある最初の回
  const nextLesson = done === null ? undefined : lessons.find((lesson) => lesson.ready && !done.includes(lesson.slug));
  const first = lessons[0];
  const hours = Math.round(course.minutes / 60);

  return (
    <div className="flex flex-col gap-16">
      <section className="flex max-w-3xl flex-col gap-5">
        <p className="text-xs font-medium tracking-wide text-accent-default">{t.learn.eyebrow}</p>
        <h1 className="text-4xl font-medium tracking-tight text-text-primary sm:text-5xl">{t.learn.title}</h1>
        <p className="max-w-[42rem] text-base leading-8 text-text-secondary">{t.learn.intro}</p>
        <p className="text-xs tabular-nums text-text-muted">{t.learn.stats(course.total, hours)}</p>
        <div className="flex flex-wrap items-center gap-sp-md">
          {first && (
            <Link
              href={`/learn/${nextLesson && doneCount > 0 ? nextLesson.slug : first.slug}`}
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              {nextLesson && doneCount > 0 ? t.learn.continueFrom(nextLesson.number) : doneCount > 0 ? t.learn.review : t.learn.start}
            </Link>
          )}
          {doneCount > 0 && (
            <div className="flex min-w-56 flex-col gap-1.5">
              <span className="text-sm text-text-secondary">
                {doneCount === course.total ? t.learn.allDone : t.learn.progress(doneCount, course.total)}
              </span>
              <Progress value={(doneCount / course.total) * 100} aria-label={t.learn.progress(doneCount, course.total)} />
            </div>
          )}
        </div>
        <p className="text-xs text-text-muted">{t.learn.progressNote}</p>
      </section>

      {course.parts.map((part, partIndex) => (
        <section key={part.id} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5 border-t border-border-subtle pt-6">
            <p className="text-xs font-medium text-text-muted">{t.learn.part(partIndex + 1)}</p>
            <h2 className="text-2xl font-medium text-text-primary">{part.title}</h2>
            <p className="text-sm text-text-secondary">{part.description}</p>
          </div>
          <ol className="grid grid-cols-1 gap-x-sp-lg gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {part.lessons.map((lesson) => {
              const finished = done?.includes(lesson.slug) ?? false;
              const body = (
                <>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[10px] bg-bg-raised">
                    {lesson.ready && lesson.cover && <ShaderThumbnail source={lesson.cover} thumbnail="" alt={lesson.title} />}
                    {!lesson.ready && (
                      <span className="absolute inset-0 grid place-items-center text-xs text-text-muted">{t.learn.comingSoon}</span>
                    )}
                    {finished && (
                      <span className="absolute right-2 top-2 rounded-full bg-bg-base/90 px-2 py-0.5 text-xs font-medium text-text-primary backdrop-blur">
                        ✓ {t.learn.done}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs tabular-nums text-text-muted">
                      {t.learn.lessonNumber(lesson.number)} · {t.learn.minutes(lesson.minutes)}
                    </p>
                    <h3 className="text-[15px] font-medium text-text-primary transition-colors group-hover:text-accent-default">
                      {lesson.title}
                    </h3>
                    <p className="text-sm leading-6 text-text-secondary">{lesson.summary}</p>
                  </div>
                </>
              );
              return (
                <li key={lesson.slug}>
                  {/* まだ本文の無い回は、目次には並べるがリンクにしない */}
                  {lesson.ready ? (
                    <Link href={`/learn/${lesson.slug}`} className="group flex flex-col gap-3">
                      {body}
                    </Link>
                  ) : (
                    <div className="flex flex-col gap-3 opacity-60">{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
