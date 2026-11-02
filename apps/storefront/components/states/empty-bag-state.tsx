"use client";

import type { ReactNode } from "react";
import type { Product } from "@rad/types";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { StateScreen, StateWorks } from "./state-screen";

export function EmptyBagState({
  suggestions,
  notice,
  title,
  body,
  actions,
}: {
  suggestions: Product[];
  /** Works that were just released from the bag, shown above the way forward. */
  notice?: ReactNode;
  title?: string;
  body?: string;
  actions?: ReactNode;
}) {
  const { t } = useLocale();
  return (
    <StateScreen
      art="empty-bag"
      as="h1"
      title={title ?? t("emptyBag")}
      body={<p>{body ?? t("emptyBagBody")}</p>}
      actions={
        actions ?? <ButtonLink href="/products">{t("viewWorks")}</ButtonLink>
      }
    >
      {notice}
      <StateWorks title={t("stateAvailableWorks")} products={suggestions} />
    </StateScreen>
  );
}
