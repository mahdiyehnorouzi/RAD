"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { journeyCopy, journeyMedia } from "./const";
import "./journey-ready.css";

export function JourneyReady() {
  const { locale, t } = useLocale();
  const copy = journeyCopy[locale];

  return (
    <article className="journey-band journey-ready">
      <span className="journey-paper" aria-hidden="true" />
      <figure className="journey-ready-photo">
        <Image src={journeyMedia.ready} alt="" fill sizes="(max-width: 900px) 58vw, 58vw" />
      </figure>
      <div className="journey-ready-sheet">
        <span className="journey-paper is-end-torn" aria-hidden="true" />
        <div className="journey-ready-copy">
          <h2>{t("ownPathTitle")}</h2>
          <p>{copy.readyLine}</p>
          <ButtonLink href="/products">{t("viewWorks")}</ButtonLink>
        </div>
      </div>
      <div className="journey-tag-hang" aria-hidden="true">
        <span className="journey-point journey-tag-hole" data-thread-anchor />
        <span className="journey-tag">
          <span>{copy.tagMark}</span>
          <span>{t("editionMark")}</span>
        </span>
        <span className="journey-point journey-tag-foot" data-thread-anchor />
      </div>
    </article>
  );
}
