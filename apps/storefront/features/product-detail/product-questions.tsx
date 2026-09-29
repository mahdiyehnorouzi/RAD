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
  const Arrow = locale === "fa" ? ArrowLeft : ArrowRight;

  return (
    <PdpSection
      id="pdp-questions-title"
      title={c.questionsTitle}
      lede={c.questionsLede}
      mark={<WorkStroke textures={textures} index={index} />}
      desktop="closed"
    >
      {showShipping ? (
        <ShippingReturnsDisclosure className={styles.shipping} />
      ) : null}
      <div>
        {faq?.items.map((item) => {
          const Icon = FAQ_ICONS[item.icon];
          return (
            <details key={item.id} className={styles.fold}>
              <summary>
                <CirclePlus
                  className={`${styles.foldToggle} ${styles.plus}`}
                  aria-hidden="true"
                />
                <CircleMinus
                  className={`${styles.foldToggle} ${styles.minus}`}
                  aria-hidden="true"
                />
                <span className={styles.foldTitle}>{item.question}</span>
                <Icon className={styles.foldIcon} aria-hidden="true" />
              </summary>
              <p>{item.answer}</p>
            </details>
          );
        })}
      </div>
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
    </PdpSection>
  );
}
