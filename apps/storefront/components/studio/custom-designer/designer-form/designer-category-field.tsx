"use client";

import type {ProductCategory} from "@rad/types";
import { artworkCategories } from "@/lib/catalog/artwork";
import { useLocale } from "@/components/i18n";

export function DesignerCategoryField({
  category,
  onChoose,
}: {
  category: ProductCategory | "";
  onChoose: (next: ProductCategory) => void;
}) {
  const { t, locale } = useLocale();
  return (
    <fieldset className="my-9 border-0 p-0">
      <legend className="mb-4 flex w-full flex-col gap-1">
        <small className="text-caption tracking-wider text-rad-clay">{t("stepOne")}</small>
        {t("chooseArtworkType")}
      </legend>
      <div className="grid grid-cols-2 gap-px border border-rad-paper/20 bg-rad-paper/20">
        {artworkCategories.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`flex min-h-[66px] items-center gap-3 border-0 bg-rad-moss p-3 text-start text-rad-paper ${
              category === item.id
                ? "bg-[color-mix(in_srgb,theme(colors.rad.moss)_78%,theme(colors.rad.sand))]"
                : ""
            }`}
            onClick={() => onChoose(item.id)}
            aria-pressed={category === item.id}
          >
            <span
              className={`category-swatch ${item.visual}`}
              style={
                {
                  "--swatch": item.preview.color,
                  "--swatch-accent": item.preview.accent,
                } as React.CSSProperties
              }
              aria-hidden="true"
            />
            {item.label[locale]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
