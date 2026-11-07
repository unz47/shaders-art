"use client";

import { useState } from "react";
import { Button } from "@frost-ui/react/atoms/button";
import { CodeBlock } from "@/components/CodeBlock";
import { InlineText } from "@/components/learn/InlineText";
import { LazyShaderPreview, PlaygroundFrame, usePlaygroundCode } from "@/components/learn/LessonPlayground";
import { useI18n } from "@/lib/i18n/client";

// 学習の課題。お題 → 書き始めのコード(starter)を書き換える → 詰まったらヒントを 1 つずつ → 見本と見比べる。
// 見本は、自分のプレビューの下に、コードと動いている絵を並べて出す。エディタに入れても 元に戻す で戻れる。
export function LessonExercise({
  index,
  title,
  prompt,
  starter,
  solution,
  hints,
  attentionSlider,
}: {
  index: number;
  title: string;
  prompt: string;
  starter: string;
  solution: string;
  hints: string[];
  attentionSlider: boolean;
}) {
  const { t } = useI18n();
  const state = usePlaygroundCode(starter);
  const [hintsShown, setHintsShown] = useState(0);
  const [solutionOpen, setSolutionOpen] = useState(false);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border-default bg-bg-raised/40 p-4 sm:p-6">
      <div className="flex max-w-[42rem] flex-col gap-1.5">
        <span className="text-xs font-medium text-accent-default">{t.learn.exercise.label(index)}</span>
        <h3 className="text-lg font-medium text-text-primary">{title}</h3>
        <p className="text-[15px] leading-7 text-text-secondary">
          <InlineText text={prompt} />
        </p>
      </div>

      <PlaygroundFrame state={state} original={starter} attentionSlider={attentionSlider} />

      <div className="flex flex-wrap items-center gap-sp-sm">
        {hintsShown < hints.length && (
          <Button variant="secondary" size="sm" onClick={() => setHintsShown((n) => n + 1)}>
            {t.learn.exercise.showHint(hintsShown + 1, hints.length)}
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={() => setSolutionOpen((open) => !open)} aria-expanded={solutionOpen}>
          {solutionOpen ? t.learn.exercise.hideSolution : t.learn.exercise.showSolution}
        </Button>
      </div>

      {hintsShown > 0 && (
        <ol className="flex max-w-[42rem] flex-col gap-2">
          {hints.slice(0, hintsShown).map((hint, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-7 text-text-secondary">
              <span className="mt-[3px] shrink-0 text-xs leading-6 text-text-muted">{t.learn.exercise.hint(i + 1)}</span>
              <span>
                <InlineText text={hint} />
              </span>
            </li>
          ))}
        </ol>
      )}

      {solutionOpen && (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-base">
          <div className="flex items-center gap-sp-sm border-b border-border-subtle px-4 py-2">
            <span className="text-sm font-medium text-text-primary">{t.learn.exercise.solution}</span>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={() => state.replace(solution)} title={t.learn.exercise.useSolutionHint}>
              {t.learn.exercise.useSolution}
            </Button>
          </div>
          <div className="grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className="order-2 flex max-h-[32rem] flex-col border-t border-border-subtle bg-bg-raised md:order-1 md:border-r md:border-t-0">
              <CodeBlock source={solution} />
            </div>
            <div className="order-1 md:order-2">
              <LazyShaderPreview source={solution} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
