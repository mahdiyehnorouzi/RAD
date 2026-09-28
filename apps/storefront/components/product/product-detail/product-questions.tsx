"use client";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  MessageCircle,
  PackageCheck,
  Palette,
  ShieldCheck,
  Truck,
} from "lucide-react";
import type { FaqContent, FaqIcon } from "@rad/types";
import { ShippingReturnsDisclosure } from "@/components/help";
import { useLocale } from "@/components/i18n";
import { pdpCopy } from "./const";
import { PdpSection } from "./pdp-section";

const FAQ_ICONS: Record<FaqIcon, typeof ShieldCheck> = {
  "shield-check": ShieldCheck,
  "package-check": PackageCheck,
  truck: Truck,
  palette: Palette,
};

export function ProductQuestions({
  faq,
  showShipping,
}: {
  faq: FaqContent | null;
  showShipping: boolean;
}) {
  const { locale, href } = useLocale();
  const c = pdpCopy[locale];
  const Arrow = locale === "fa" ? ArrowLeft : ArrowRight;

  return (
    <PdpSection
      id="pdp-questions-title"
      title={c.questionsTitle}
      desktop="closed"
      className="pdp-questions"
    >
      <div className="pdp-folds">
        {showShipping ? (
          <ShippingReturnsDisclosure className="pdp-fold" />
        ) : null}
        {faq?.items.map((item) => {
          const Icon = FAQ_ICONS[item.icon];
          return (
            <details key={item.id} className="pdp-fold">
              <summary>
                <span className="pdp-fold-title">
                  <Icon aria-hidden="true" />
                  {item.question}
                </span>
                <ChevronDown className="pdp-fold-chevron" aria-hidden="true" />
              </summary>
              <p>{item.answer}</p>
            </details>
          );
        })}
        <Link className="pdp-fold pdp-fold-link" href={href("/contact")}>
          <span className="pdp-fold-title">
            <MessageCircle aria-hidden="true" />
            {c.ask}
          </span>
          <Arrow className="pdp-fold-chevron" aria-hidden="true" />
        </Link>
      </div>
    </PdpSection>
  );
}
