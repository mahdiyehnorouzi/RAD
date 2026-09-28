"use client";
import type { CSSProperties } from "react";
import type { Artwork, Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { RadFingerprint } from "@/components/identity";
import type { RadPassport } from "@/components/passport/type";
import { passportYear } from "@/lib/passport";
import { formatArtworkNumber } from "../listing";
import { MAKING_PATHS, pdpCopy } from "./const";
import { PdpSection } from "./pdp-section";

export function ProductMaking({
  product,
  artwork,
  passport,
}: {
  product: Product;
  artwork?: Artwork;
  passport?: RadPassport;
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
      className="pdp-making"
    >
      <ol
        className="pdp-making-path"
        style={{ "--steps": steps.length + 1 } as CSSProperties}
      >
        {steps.map((step) => (
          <li key={step.id}>
            <i className="pdp-making-node" aria-hidden="true" />
            <span>{step.label[locale]}</span>
          </li>
        ))}
        <li className="is-work">
          <RadFingerprint
            radNumber={product.radNumber}
            className="pdp-making-print"
          />
          <span dir="ltr">{recordNumber}</span>
          {year ? <small>{year}</small> : null}
        </li>
      </ol>
    </PdpSection>
  );
}
