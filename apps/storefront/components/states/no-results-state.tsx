"use client";

import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { useLocale } from "@/components/i18n";
import type { StateChip } from "./type";
import { StateChips, StateScreen } from "./state-screen";

export function NoResultsState({
  query,
  onClearQuery,
  categories,
  actions,
}: {
  query: string;
  onClearQuery: () => void;
  categories: StateChip[];
  actions?: ReactNode;
}) {
  const { t } = useLocale();
  return (
    <StateScreen
      art="no-results"
      title={t("noSearchTitle", { query })}
      body={
        <>
          <p>{t("noSearchBody")}</p>
          <button
            type="button"
            className="state-query"
            onClick={onClearQuery}
            aria-label={t("stateClearQuery", { query })}
          >
            <Search className="state-query-search" aria-hidden="true" />
            <span dir="auto">{query}</span>
            <span className="state-query-clear" aria-hidden="true">
              <X />
            </span>
          </button>
        </>
      }
      actions={actions}
    >
      <StateChips title={t("stateCategoriesTitle")} chips={categories} />
    </StateScreen>
  );
}
