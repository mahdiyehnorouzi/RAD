"use client";

import { Heart } from "lucide-react";
import { useCommerce } from "@/components/commerce/commerce-provider";
import { useLocale } from "@/components/i18n";

export function FavoriteButton({
  slug,
  compact = false,
}: {
  slug: string;
  compact?: boolean;
}) {
  const { isFavorite, toggleFavorite } = useCommerce();
  const { t } = useLocale();
  const active = isFavorite(slug);
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 border-0 bg-transparent text-rad-ink ${
        compact
          ? "absolute end-3 top-3 z-10 h-10 w-10 justify-center"
          : "min-h-11"
      } ${active ? "text-rad-clay" : ""}`}
      onClick={() => toggleFavorite(slug)}
      aria-pressed={active}
      aria-label={active ? t("removeFavorite") : t("addFavorite")}
    >
      <Heart aria-hidden="true" fill={active ? "currentColor" : "none"} />
      {!compact && (
        <b className="font-medium">
          {active ? t("savedFavorite") : t("saveFavorite")}
        </b>
      )}
    </button>
  );
}
