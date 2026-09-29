"use client";

import { RotateCw } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { StateScreen } from "@/components/states";
import { ButtonLink } from "@/components/ui/button-link";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { quizCopy } from "./const";
import type { ShapeQuestionsStatus } from "./type";

/** What the sheet shows while the questions load, fail, or have all been removed. */
export function QuizStatus({
  status,
  onRetry,
}: {
  status: ShapeQuestionsStatus;
  onRetry: () => void;
}) {
  const { locale } = useLocale();
  const c = quizCopy[locale];

  if (status === "loading") return <CardListSkeleton count={2} />;
  if (status === "error")
    return (
      <StateScreen
        art="error"
        tone="error"
        layout="stack"
        title={c.errorTitle}
        body={<p>{c.errorBody}</p>}
        actions={
          <button type="button" className="button" onClick={onRetry}>
            <span>{c.retry}</span>
            <RotateCw className="state-screen-icon" aria-hidden="true" />
          </button>
        }
      />
    );
  return (
    <StateScreen
      art="no-results"
      layout="stack"
      title={c.emptyTitle}
      body={<p>{c.emptyBody}</p>}
      actions={<ButtonLink href="/products">{c.archive}</ButtonLink>}
    />
  );
}
