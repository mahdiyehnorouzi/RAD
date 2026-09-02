"use client";

import { DifferenceTrailStrip, surprisePermissions } from "@/components/difference";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { museumPortraits } from "@/lib/difference";

export default function DifferencesMuseum() {
  const { locale, t } = useLocale();
  return (
    <section className="museum-page section">
      <header className="museum-heading">
        <span className="eyebrow">{t("museumEyebrow")}</span>
        <h1>{t("museumTitle")}</h1>
        <p>{t("museumBody")}</p>
      </header>
      <div className="museum-grid">
        {museumPortraits.map((portrait) => {
          const headingId = `museum-${portrait.id}`;
          const permission = surprisePermissions.find(
            (item) => item.id === portrait.permission,
          );
          return (
            <article className="museum-card" key={portrait.id}>
              <span dir="ltr">{portrait.code}</span>
              <h2 id={headingId}>{portrait.described[locale]}</h2>
              <p>
                {portrait.maker[locale]}
                {permission ? ` · ${permission.title[locale]}` : ""}
              </p>
              <DifferenceTrailStrip
                portrait={portrait}
                labelledBy={headingId}
              />
              <ButtonLink href={`/differences/${portrait.id}`} outline>
                {t("differenceOpen")}
              </ButtonLink>
            </article>
          );
        })}
      </div>
      <aside className="impossible-brief">
        <span className="eyebrow">{t("impossibleEyebrow")}</span>
        <h2>{t("impossibleTitle")}</h2>
        <p>{t("impossibleBody")}</p>
        <ButtonLink href="/studio">{t("designMine")}</ButtonLink>
      </aside>
    </section>
  );
}
