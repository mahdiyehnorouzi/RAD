"use client";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { homeMedia } from "../const";
import { useInView } from "../hooks";
import "../motion/reveal.css";
import "./entry-paths.css";

export function EntryPaths() {
  const { t } = useLocale();
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.16 });

  return (
    <section
      ref={ref}
      className={`entry-paths home-reveal${inView ? " is-visible" : ""}`}
      aria-label={t("entryPathsAria")}
    >
      <article className="entry-path entry-path-ready reveal-item" data-reveal="media">
        <figure className="entry-path-media">
          <Image
            className="entry-path-photo"
            src={homeMedia.entryReady}
            alt=""
            fill
            sizes="(max-width: 900px) 100vw, 62vw"
            priority
          />
        </figure>
        <div className="entry-path-copy">
          <h2>{t("ownPathTitle")}</h2>
          <ButtonLink href="/products" outline>
            {t("viewWorks")}
          </ButtonLink>
        </div>
      </article>
      <article className="entry-path entry-path-custom reveal-item" data-reveal="cta">
        <figure className="entry-path-media">
          <Image
            className="entry-path-photo"
            src={homeMedia.entryCustom}
            alt={t("makingPathPhotoAlt")}
            fill
            sizes="(max-width: 900px) 100vw, 38vw"
          />
        </figure>
        <div className="entry-path-copy">
          <h2>{t("createPathTitle")}</h2>
          <ButtonLink href="/studio" outline>
            {t("startDesign")}
          </ButtonLink>
        </div>
      </article>
    </section>
  );
}
