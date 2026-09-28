"use client";

import type { ReactNode } from "react";
import type { Product } from "@rad/types";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { StateScreen, StateWorks } from "./state-screen";

export function EmptyBagState({
  suggestions,
  notice,
}: {
  suggestions: Product[];
  /** Works that were just released from the bag, shown above the way forward. */
  notice?: ReactNode;
}) {
  const { t } = useLocale();
  return (
    <StateScreen
      art="empty-bag"
      as="h1"
      title={t("emptyBag")}
      body={<p>{t("emptyBagBody")}</p>}
      actions={<ButtonLink href="/products">{t("viewWorks")}</ButtonLink>}
    >
      {notice}
      <StateWorks title={t("stateAvailableWorks")} products={suggestions} />
    </StateScreen>
  );
}
