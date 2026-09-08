"use client";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { homeMedia } from "../const";
import "./entry-paths.css";

export function EntryPaths() {
  const { t } = useLocale();

  return (
    <section className="entry-paths" aria-label={t("entryPathsAria")}>
      <article className="entry-path">
        <img src={homeMedia.entryReady} alt="" fetchPriority="high" />
        <div>
          <h2>{t("ownPathTitle")}</h2>
          <ButtonLink href="/products" outline>
            {t("viewWorks")}
          </ButtonLink>
        </div>
      </article>
      <article className="entry-path">
        <img src={homeMedia.entryCustom} alt={t("makingPathPhotoAlt")} />
        <div>
          <h2>{t("createPathTitle")}</h2>
          <ButtonLink href="/studio" outline>
            {t("startDesign")}
          </ButtonLink>
        </div>
      </article>
    </section>
  );
}
