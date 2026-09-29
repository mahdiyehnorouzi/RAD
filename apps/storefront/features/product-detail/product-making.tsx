"use client";
import type { CSSProperties } from "react";
import type { Artwork, Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { RadFingerprint } from "@/components/identity";
import type { RadPassport } from "@/components/passport/type";
import type { WorkTexture } from "@/lib/catalog/material-texture";
import { passportYear } from "@/lib/passport";
import { formatArtworkNumber } from "@/components/product/listing";
import { MAKING_PATHS, pdpCopy } from "./const";
import { PdpSection } from "./pdp-section";
import { WorkStroke } from "./work-stroke";
import styles from "./product-making.module.css";

export function ProductMaking({
  product,
  artwork,
  passport,
  textures,
  index,
}: {
  product: Product;
  artwork?: Artwork;
  passport?: RadPassport;
  textures: WorkTexture[];
  index: number;
}) {
  const { locale, number } = useLocale();
  const c = pdpCopy[locale];
  const recordNumber = formatArtworkNumber(product, number, locale);
  const recorded = [
    artwork?.materials.body,
    artwork?.materials.surface,
    artwork?.materials.process,
    artwork?.description,
  ]
    .flatMap((text) => (text ? [text.fa, text.en] : []))
    .join(" ");
  const steps = (MAKING_PATHS[product.category] ?? []).filter(
    (step) => !step.when || step.when.test(recorded),
  );
  if (!steps.length || !recordNumber || !product.radNumber) return null;
  const year = passport ? passportYear(passport, locale) : undefined;

  return (
    <PdpSection
      id="pdp-making-title"
      title={c.makingTitle}
      lede={c.makingLede}
      mark={<WorkStroke textures={textures} index={index} />}
    >
      <ol
        className={styles.makingPath}
        style={{ "--steps": steps.length + 1 } as CSSProperties}
      >
        {steps.map((step) => (
          <li key={step.id}>
            <i className={styles.makingNode} aria-hidden="true" />
            <span>{step.label[locale]}</span>
          </li>
        ))}
        <li className={styles.work}>
          <RadFingerprint
            radNumber={product.radNumber}
            className={styles.makingPrint}
            animate
          />
          <span dir="ltr">{recordNumber}</span>
          {year ? <small>{year}</small> : null}
        </li>
      </ol>
    </PdpSection>
  );
}
