"use client";

import type { Product } from "@rad/types";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { StateScreen, StateWorks } from "./state-screen";

export function EmptyFavoritesState({ suggestions }: { suggestions: Product[] }) {
  const { t } = useLocale();
  return (
    <StateScreen
      art="empty-favorites"
      title={t("emptyFavorites")}
      body={<p>{t("emptyFavoritesBody")}</p>}
      actions={<ButtonLink href="/products">{t("emptyFavoritesAction")}</ButtonLink>}
    >
      <StateWorks title={t("stateAvailableWorks")} products={suggestions} />
    </StateScreen>
  );
}
