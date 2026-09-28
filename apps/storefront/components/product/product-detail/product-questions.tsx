"use client";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CircleMinus,
  CirclePlus,
  PackageCheck,
  Palette,
  ShieldCheck,
  Truck,
} from "lucide-react";
import type { FaqContent, FaqIcon } from "@rad/types";
import { ShippingReturnsDisclosure } from "@/components/help";
import { useLocale } from "@/components/i18n";
import type { WorkTexture } from "@/lib/catalog/material-texture";
import { pdpCopy } from "./const";
import { PdpSection } from "./pdp-section";
import { WorkStroke } from "./work-stroke";

const FAQ_ICONS: Record<FaqIcon, typeof ShieldCheck> = {
  "shield-check": ShieldCheck,
  "package-check": PackageCheck,
  truck: Truck,
  palette: Palette,
};

export function ProductQuestions({
  faq,
  showShipping,
  textures,
  index,
}: {
  faq: FaqContent | null;
  showShipping: boolean;
  textures: WorkTexture[];
  index: number;
}) {
  const { locale, href } = useLocale();
  const c = pdpCopy[locale];
  const Arrow = locale === "fa" ? ArrowLeft : ArrowRight;

  return (
    <PdpSection
      id="pdp-questions-title"
      title={c.questionsTitle}
      lede={c.questionsLede}
      mark={<WorkStroke textures={textures} index={index} />}
      desktop="closed"
      className="pdp-questions"
    >
      {showShipping ? (
        <ShippingReturnsDisclosure className="pdp-shipping" />
      ) : null}
      <div className="pdp-folds">
        {faq?.items.map((item) => {
          const Icon = FAQ_ICONS[item.icon];
          return (
            <details key={item.id} className="pdp-fold">
              <summary>
                <CirclePlus
                  className="pdp-fold-toggle is-plus"
                  aria-hidden="true"
                />
                <CircleMinus
                  className="pdp-fold-toggle is-minus"
                  aria-hidden="true"
                />
                <span className="pdp-fold-title">{item.question}</span>
                <Icon className="pdp-fold-icon" aria-hidden="true" />
              </summary>
              <p>{item.answer}</p>
            </details>
          );
        })}
      </div>
      <Link className="pdp-ask" href={href("/contact")}>
        <span className="pdp-ask-text">
          <strong>{c.ask}</strong>
          <span>{c.askLede}</span>
        </span>
        <WorkStroke
          textures={textures}
          index={index + 1}
          className="pdp-ask-stroke"
        />
        <Arrow className="pdp-ask-arrow" aria-hidden="true" />
      </Link>
    </PdpSection>
  );
}
