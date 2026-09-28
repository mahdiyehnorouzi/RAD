"use client";

import { useLocale } from "@/components/i18n";
import { heroWorkSrc } from "../const";

export function CatalogHero({
  intro,
  search,
}: {
  intro: React.ReactNode;
  search: React.ReactNode;
}) {
  const { t } = useLocale();
  return (
    <header className="plp-hero">
      <div className="plp-hero-copy">
        {intro}
        {search}
      </div>
      <figure className="plp-hero-art" aria-hidden="true">
        <svg
          className="plp-hero-blob"
          viewBox="0 0 520 420"
          preserveAspectRatio="none"
        >
          <path d="M118 44C196 4 318 6 392 52c62 39 86 116 70 196-15 78-63 134-150 150-94 17-192-6-243-72C22 262 26 168 52 110c14-31 37-52 66-66Z" />
        </svg>
        <svg className="plp-hero-line" viewBox="0 0 520 420">
          <path
            pathLength={1}
            d="M-12 330c58-4 104-30 142-58 52-38 118-44 176-18 50 22 96 40 132 12 38-30 38-92 6-126-26-28-66-26-82 2-12 22 2 46 26 44"
          />
        </svg>
        <span className="plp-hero-plinth" />
        <img className="plp-hero-work" src={heroWorkSrc} alt="" />
        <span className="plp-hero-note">{t("shopHeroNote")}</span>
      </figure>
    </header>
  );
}
