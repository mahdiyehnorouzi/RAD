"use client";

import {
  ChevronDown,
  PackageCheck,
  Palette,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Eyebrow, PageSection } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";
import { faqKeys } from "@/i18n/catalog";

const icons = [ShieldCheck, PackageCheck, Truck, Palette];

export function ShippingFaq() {
  const { t } = useLocale();
  return (
    <PageSection>
      <header className="mb-8">
        <Eyebrow>{t("radDelivery")}</Eyebrow>
        <h2 className="m-0 text-h2 font-normal">{t("beforeYouBuy")}</h2>
      </header>
      <div>
        {faqKeys.map((item, index) => {
          const Icon = icons[index];
          return (
            <details key={item.q} className="group border-t border-rad-line">
              <summary className="flex min-h-[78px] cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-3.5">
                  <Icon
                    className="h-[23px] w-[23px] shrink-0 text-rad-clay"
                    aria-hidden="true"
                  />
                  {t(item.q)}
                </span>
                <ChevronDown
                  className="h-[19px] w-[19px] shrink-0 transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="pb-4 text-prose text-rad-muted">{t(item.a)}</p>
            </details>
          );
        })}
      </div>
    </PageSection>
  );
}
