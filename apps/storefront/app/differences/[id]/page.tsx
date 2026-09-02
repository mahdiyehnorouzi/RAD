"use client";

import { useParams } from "next/navigation";
import { DifferencePortraitView } from "@/components/difference";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { portraitById } from "@/lib/difference";

export default function DifferenceDetail() {
  const params = useParams<{ id: string }>();
  const { t } = useLocale();
  const portrait = portraitById(String(params.id ?? ""));
  if (!portrait) {
    return (
      <section className="museum-page section">
        <header className="museum-heading">
          <span className="eyebrow">{t("museumEyebrow")}</span>
          <h1>{t("museumMissing")}</h1>
        </header>
        <ButtonLink href="/differences" outline>
          {t("museumBack")}
        </ButtonLink>
      </section>
    );
  }
  return (
    <section className="museum-page section">
      <DifferencePortraitView portrait={portrait} privateReveal />
      <div className="museum-detail-actions">
        <ButtonLink href="/differences" outline>
          {t("museumBack")}
        </ButtonLink>
        <ButtonLink href="/studio">{t("designMine")}</ButtonLink>
      </div>
    </section>
  );
}
