"use client";

import { useEffect, useState } from "react";
import { StageView } from "@/components/StageView";
import { useI18n } from "@/lib/i18n/client";
import { getWork } from "@/lib/works";

type State = { status: "loading" } | { status: "missing" } | { status: "found"; source: string };

export function StageWork({ slug }: { slug: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const { t } = useI18n();

  useEffect(() => {
    let cancelled = false;
    getWork(slug).then(
      (work) => {
        if (!cancelled) setState(work ? { status: "found", source: work.source } : { status: "missing" });
      },
      () => {
        if (!cancelled) setState({ status: "missing" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <StageView
      source={state.status === "found" ? state.source : null}
      message={state.status === "missing" ? t.stage.notFound : ""}
      creditHref={`/s/${encodeURIComponent(slug)}`}
    />
  );
}
