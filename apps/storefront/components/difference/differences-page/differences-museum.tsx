"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import {
  differenceMedia,
  differencePageCopy,
  surprisePermissions,
  traceTears,
} from "../const";
import { TraceTear } from "../trace";
import { DifferenceTrailStrip } from "../trail-strip";
import type { DifferencePortrait } from "../type";

export function DifferencesMuseum({
  portraits,
}: {
  portraits: DifferencePortrait[];
}) {
  const { locale, t, href } = useLocale();
  const c = differencePageCopy[locale];

  return (
    <section
      className="differences-museum"
      aria-labelledby="differences-museum-title"
    >
      <figure className="differences-museum-band">
        <TraceTear
          shape={traceTears.band}
          className="differences-museum-tear is-top"
        />
        <Image
          src={differenceMedia.museum}
          alt={c.museumAlt}
          fill
          sizes="100vw"
        />
        <TraceTear
          shape={traceTears.hero}
          className="differences-museum-tear is-bottom"
        />
      </figure>

      <header className="trace-section-head differences-museum-head">
        <h2 id="differences-museum-title">{t("museumTitle")}</h2>
        <p>{t("museumBody")}</p>
      </header>

      <ul className="differences-works">
        {portraits.map((portrait) => {
          const headingId = `museum-${portrait.id}`;
          const path = `/differences/${portrait.id}`;
          const photo = portrait.stageImages?.material;
          const palette = portrait.palette.material;
          const permission = surprisePermissions.find(
            (item) => item.id === portrait.permission,
          );
          return (
            <li key={portrait.id}>
              <article className="differences-work">
                <Link
                  className="differences-work-photo"
                  href={href(path)}
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  {photo ? (
                    <Image
                      src={photo}
                      alt=""
                      fill
                      sizes="(min-width: 960px) 36rem, 100vw"
                    />
                  ) : (
                    <span
                      className="trace-step-swatch"
                      style={
                        {
                          "--swatch": palette.color,
                          "--swatch-accent": palette.accent,
                        } as React.CSSProperties
                      }
                    />
                  )}
                </Link>
                <div className="differences-work-copy">
                  <span className="differences-work-code" dir="ltr">
                    {portrait.code}
                  </span>
                  <h3 id={headingId}>
                    <Link href={href(path)}>
                      {portrait.title?.[locale] ?? portrait.described[locale]}
                    </Link>
                  </h3>
                  {portrait.title ? <p>{portrait.described[locale]}</p> : null}
                  <p className="differences-work-meta">
                    {portrait.maker[locale]}
                    {permission ? ` · ${permission.title[locale]}` : ""}
                  </p>
                </div>
                <DifferenceTrailStrip
                  portrait={portrait}
                  labelledBy={headingId}
                />
                <ButtonLink
                  href={path}
                  outline
                  className="differences-work-open"
                >
                  {t("differenceOpen")}
                </ButtonLink>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
