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
      className={`favorite-button ${compact ? "compact" : ""} ${active ? "active" : ""}`}
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
