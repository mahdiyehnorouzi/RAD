"use client";

import { artworkCategoryById } from "@/lib/catalog/artwork";
import { useLocale } from "@/components/i18n";
import type {ProductCategory} from "@rad/types";

export function DesignerBriefFields({
  category,
  brief,
  setBrief,
}: {
  category: ProductCategory | "";
  brief: Record<string, string>;
  setBrief: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const { t, locale } = useLocale();
  const selectedCategory = category ? artworkCategoryById(category) : null;
  if (!selectedCategory) return null;
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-4 flex w-full flex-col gap-1">
        <small className="text-caption tracking-wider text-rad-clay">{t("stepTwo")}</small>
        {t("briefDetails", { name: selectedCategory.shortLabel[locale] })}
      </legend>
      {selectedCategory.fields.map((field) => (
        <div
          className="grid grid-cols-[minmax(90px,0.38fr)_1fr] gap-4 border-b border-rad-paper/20 py-4"
          key={field.key}
        >
          <span className="text-identifier text-rad-paper/70">{field.label[locale]}</span>
          <div className="flex flex-wrap gap-2">
            {field.options[locale].map((option) => (
              <button
                type="button"
                key={option}
                className={`rounded-full border px-2.5 py-1 ${
                  brief[field.key] === option
                    ? "border-rad-sand bg-rad-sand text-rad-ink"
                    : "border-rad-paper/30 bg-transparent text-rad-paper"
                }`}
                onClick={() =>
                  setBrief((current) => ({
                    ...current,
                    [field.key]: option,
                  }))
                }
                aria-pressed={brief[field.key] === option}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}
    </fieldset>
  );
}
