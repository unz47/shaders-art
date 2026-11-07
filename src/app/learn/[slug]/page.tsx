import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeBlock } from "@/components/CodeBlock";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { InlineText } from "@/components/learn/InlineText";
import { LessonExercise } from "@/components/learn/LessonExercise";
import { LessonFinish } from "@/components/learn/LessonFinish";
import { LessonPlayground } from "@/components/learn/LessonPlayground";
import type { Dictionary } from "@/lib/i18n";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { type LocalizedBlock, type LocalizedLesson, localizeLesson } from "@/lib/learn/localize";

// /learn/{slug} … 学習の 1 回分。本文はサーバーで見る人の言語に絞って描き、書き換えられるコード(playground)と
// 課題(exercise)だけをブラウザの部品にする。
// 広い画面では左に「この回の内容」を固定して出す。本文は読みやすい幅(42rem)、コードとプレビューは横いっぱいに広げる。
// 本文がまだ無い回(コースに題名だけ先に並べた回)は「準備中」と出す。

export async function generateMetadata({ params }: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const lesson = localizeLesson(slug, await getLocale());
  if (!lesson) return {};
  return { title: `${lesson.title} — Learn — shaders.art`, description: lesson.summary };
}

export default async function LessonPage({ params }: PageProps<"/learn/[slug]">) {
  const { slug } = await params;
  const [locale, t] = await Promise.all([getLocale(), getDictionary()]);
  const lesson = localizeLesson(slug, locale);
  if (!lesson) notFound();

  return (
    <div className="flex min-h-dvh flex-col">
      <Header showSearch={false} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-sp-xl pt-8">
        <div className="xl:grid xl:grid-cols-[14rem_minmax(0,1fr)] xl:gap-14">
          <aside className="hidden xl:block">
            <nav aria-label={t.learn.outline} className="sticky top-24 flex flex-col gap-3">
              <Link href="/learn" className="text-xs text-text-muted transition-colors hover:text-text-primary">
                ← {t.learn.course}
              </Link>
              <Outline lesson={lesson} t={t} />
            </nav>
          </aside>

          <article className="flex min-w-0 flex-col gap-6">
            <LessonHeader lesson={lesson} t={t} />
            <div className="xl:hidden">
              <details className="group rounded-xl border border-border-subtle px-4 py-3 open:pb-4">
                <summary className="cursor-pointer select-none text-sm font-medium text-text-primary">{t.learn.outline}</summary>
                <div className="mt-3">
                  <Outline lesson={lesson} t={t} />
                </div>
              </details>
            </div>
            {lesson.ready ? (
              <>
                {lesson.blocks.map((block, i) => (
                  <Block key={i} block={block} t={t} />
                ))}
                <div className="mt-6">
                  <LessonFinish slug={lesson.slug} next={lesson.next} />
                </div>
              </>
            ) : (
              // まだ本文の無い回(コースに題名だけ先に並べてある回)
              <p className="max-w-[42rem] rounded-xl border border-border-subtle px-5 py-4 text-[15px] leading-7 text-text-secondary">
                {t.learn.comingSoonNote}
              </p>
            )}
            <LessonNav lesson={lesson} t={t} />
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Outline({ lesson, t }: { lesson: LocalizedLesson; t: Dictionary }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="hidden text-xs font-medium text-text-secondary xl:block">{t.learn.outline}</p>
      <ol className="flex flex-col gap-1.5 text-sm">
        {lesson.outline.map((item, i) => (
          <li key={item.id} className="flex gap-2">
            <span className="w-5 shrink-0 font-mono text-xs leading-5 text-text-muted">{String(i + 1).padStart(2, "0")}</span>
            <a href={`#${item.id}`} className="leading-5 text-text-secondary transition-colors hover:text-text-primary">
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

function LessonHeader({ lesson, t }: { lesson: LocalizedLesson; t: Dictionary }) {
  return (
    <header className="flex max-w-[42rem] flex-col gap-4">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
        <Link href="/learn" className="transition-colors hover:text-text-primary">
          Learn
        </Link>
        <span aria-hidden="true">/</span>
        <span>{lesson.partTitle}</span>
      </p>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium tabular-nums text-accent-default">
          {t.learn.lessonOf(lesson.number, lesson.total)} · {t.learn.minutes(lesson.minutes)}
        </p>
        <h1 className="text-3xl font-medium tracking-tight text-text-primary sm:text-4xl">{lesson.title}</h1>
        <p className="text-base leading-7 text-text-secondary">{lesson.summary}</p>
      </div>
      {lesson.goals.length > 0 && (
        <div className="rounded-xl border border-border-subtle bg-bg-raised/60 px-5 py-4">
          <p className="mb-2 text-sm font-medium text-text-primary">{t.learn.goals}</p>
          <ul className="flex flex-col gap-1.5">
            {lesson.goals.map((goal, i) => (
              <li key={i} className="flex gap-2.5 text-[15px] leading-7 text-text-secondary">
                <span aria-hidden="true" className="text-accent-default">
                  ✓
                </span>
                <span>
                  <InlineText text={goal} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

const PROSE = "max-w-[42rem] text-[15px] leading-[1.9] text-text-secondary";

function Block({ block, t }: { block: LocalizedBlock; t: Dictionary }) {
  switch (block.type) {
    case "heading": {
      const number = block.id.replace("section-", "").padStart(2, "0");
      return (
        <h2 id={block.id} className="mt-8 flex max-w-[42rem] scroll-mt-24 items-baseline gap-3 text-xl font-medium text-text-primary">
          <span className="font-mono text-sm text-text-muted">{number}</span>
          <span>{block.text}</span>
        </h2>
      );
    }
    case "paragraph":
      return (
        <p className={PROSE}>
          <InlineText text={block.text} />
        </p>
      );
    case "list": {
      const ListTag = block.ordered ? "ol" : "ul";
      return (
        <ListTag className={`${PROSE} flex flex-col gap-1.5 pl-5 ${block.ordered ? "list-decimal" : "list-disc"} marker:text-text-muted`}>
          {block.items.map((item, i) => (
            <li key={i} className="pl-1">
              <InlineText text={item} />
            </li>
          ))}
        </ListTag>
      );
    }
    case "note":
      return (
        <div
          className={`max-w-[42rem] rounded-r-lg border-l-2 px-4 py-3 ${
            block.tone === "warning"
              ? "border-status-warning-solid bg-status-warning-subtle-bg"
              : "border-accent-default bg-bg-raised"
          }`}
        >
          <p className="mb-1 text-xs font-medium text-text-primary">{t.learn.note[block.tone]}</p>
          <p className="text-[15px] leading-7 text-text-secondary">
            <InlineText text={block.text} />
          </p>
        </div>
      );
    case "code":
      return (
        <figure className="flex max-w-[42rem] flex-col gap-2">
          <div className="flex overflow-hidden rounded-xl border border-border-subtle bg-bg-raised">
            <CodeBlock source={block.source} />
          </div>
          {block.caption && (
            <figcaption className="text-sm leading-6 text-text-muted">
              <InlineText text={block.caption} />
            </figcaption>
          )}
        </figure>
      );
    case "playground":
      return (
        <figure className="flex flex-col gap-2">
          <LessonPlayground source={block.source} attentionSlider={block.attentionSlider} />
          {block.caption && (
            <figcaption className="max-w-[42rem] text-sm leading-6 text-text-secondary">
              <span className="mr-1.5 text-accent-default">▸</span>
              <InlineText text={block.caption} />
            </figcaption>
          )}
        </figure>
      );
    case "exercise":
      return (
        <LessonExercise
          index={block.index}
          title={block.title}
          prompt={block.prompt}
          starter={block.starter}
          solution={block.solution}
          hints={block.hints}
          attentionSlider={block.attentionSlider}
        />
      );
  }
}

function LessonNav({ lesson, t }: { lesson: LocalizedLesson; t: Dictionary }) {
  return (
    <nav className="grid gap-4 sm:grid-cols-2">
      {lesson.previous ? (
        <Link
          href={`/learn/${lesson.previous.slug}`}
          className="flex flex-col gap-1 rounded-xl border border-border-subtle px-5 py-4 transition-colors hover:border-border-strong"
        >
          <span className="text-xs text-text-muted">← {t.learn.previous}</span>
          <span className="text-sm text-text-primary">
            {t.learn.lessonNumber(lesson.previous.number)} {lesson.previous.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {lesson.next ? (
        <Link
          href={`/learn/${lesson.next.slug}`}
          className="flex flex-col items-end gap-1 rounded-xl border border-border-subtle px-5 py-4 text-right transition-colors hover:border-border-strong"
        >
          <span className="text-xs text-text-muted">{t.learn.next} →</span>
          <span className="text-sm text-text-primary">
            {t.learn.lessonNumber(lesson.next.number)} {lesson.next.title}
          </span>
        </Link>
      ) : (
        <Link
          href="/learn"
          className="flex flex-col items-end gap-1 rounded-xl border border-border-subtle px-5 py-4 text-right transition-colors hover:border-border-strong"
        >
          <span className="text-xs text-text-muted">{t.learn.course} →</span>
          <span className="text-sm text-text-primary">Learn</span>
        </Link>
      )}
    </nav>
  );
}
