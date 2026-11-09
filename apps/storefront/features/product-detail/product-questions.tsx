"use client";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  PackageCheck,
  Palette,
  ShieldCheck,
  Truck,
} from "lucide-react";
import type { FaqContent, FaqIcon } from "@rad/types";
// Imported from its own sub-path, not the `@/components/help` barrel —
// that barrel also reaches help-hub/policy-page, which the PDP has no
// use for.
import { purchasePathCopy } from "@/components/help/const";
import { ShippingReturnsDisclosure } from "@/components/help/purchase-path";
import { useLocale } from "@/components/i18n";
import type { WorkTexture } from "@/lib/catalog/material-texture";
import { pdpCopy } from "./const";
import { PdpSection } from "./pdp-section";
import { WorkStroke } from "./work-stroke";
import styles from "./product-questions.module.css";

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
  const path = purchasePathCopy[locale];
  const Arrow = locale === "fa" ? ArrowLeft : ArrowRight;
  const packaging = faq?.items.find((item) => item.id === "packaging");
  const questions = (faq?.items ?? []).filter(
    (item) => item.id !== "packaging",
  );
  const ask = (
    <Link className={styles.ask} href={href("/contact")}>
      <span className={styles.askText}>
        <strong>{c.ask}</strong>
        <span>{c.askLede}</span>
      </span>
      <WorkStroke
        textures={textures}
        index={index + 1}
        className={styles.askStroke}
      />
      <Arrow className={styles.askArrow} aria-hidden="true" />
    </Link>
  );

  return (
    <>
      {showShipping ? (
        <PdpSection
          id="pdp-shipping-title"
          title={path.disclosureTitle}
          lede={path.disclosureTeaser}
          mark={<Truck aria-hidden="true" />}
        >
          <ShippingReturnsDisclosure />
        </PdpSection>
      ) : null}
      {packaging ? (
        <PdpSection
          id="pdp-packaging-title"
          title={packaging.question}
          mark={<PackageCheck aria-hidden="true" />}
        >
          <p className={styles.answer}>{packaging.answer}</p>
        </PdpSection>
      ) : null}
      {questions.length ? (
        <PdpSection
          id="pdp-questions-title"
          title={faq?.title ?? c.questionsTitle}
          lede={c.questionsLede}
          mark={<MessageCircle aria-hidden="true" />}
        >
          <ul className={styles.questions}>
            {questions.map((item) => {
              const Icon = FAQ_ICONS[item.icon];
              return (
                <li key={item.id}>
                  <Icon aria-hidden="true" />
                  <div>
                    <strong>{item.question}</strong>
                    <p>{item.answer}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          {ask}
        </PdpSection>
      ) : (
        ask
      )}
    </>
  );
}
