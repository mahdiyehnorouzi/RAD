"use client";

import { ArtworkVisual } from "@/components/product/artwork-visual";
import "@/components/product/artwork-visual/artwork.css";
import { Button } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { artworkCategoryById } from "@/lib/catalog/artwork";
import type { DesignerStatus } from "@/components/studio/type";

export function DesignerPreview({
  image,
  status,
  selectedCategory,
  onReset,
}: {
  image: string;
  status: DesignerStatus;
  selectedCategory: ReturnType<typeof artworkCategoryById> | null | undefined;
  onReset: () => void;
}) {
  const { t } = useLocale();
  return (
    <section
      className="relative min-h-[560px] overflow-hidden bg-rad-ink text-rad-paper lg:min-h-[min(76vh,820px)]"
      aria-live="polite"
    >
      {image ? (
        <img src={image} alt={t("generatedAlt")} className="h-full w-full object-contain" />
      ) : selectedCategory ? (
        <div className="grid h-full place-items-center content-center gap-4 p-8 text-center">
          <ArtworkVisual
            visual={selectedCategory.visual}
            color={selectedCategory.preview.color}
            accent={selectedCategory.preview.accent}
            className="designer-artwork"
          />
          <p>{status === "loading" ? t("generating") : t("preview")}</p>
        </div>
      ) : (
        <div className="grid h-full place-items-center content-center gap-5 p-8 text-center">
          <span className="grid aspect-square w-[78px] place-items-center rounded-full border border-current text-caption">
            1 / 1
          </span>
          <p className="max-w-xs text-rad-muted">{t("chooseCategoryToBegin")}</p>
        </div>
      )}
      {status === "done" ? (
        <div className="absolute inset-x-0 bottom-6 flex justify-center gap-4">
          <Button type="button" variant="light" onClick={onReset}>
            {t("anotherVersion")}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
