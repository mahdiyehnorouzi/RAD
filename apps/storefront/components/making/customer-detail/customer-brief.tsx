"use client";

import { useLocale } from "@/components/i18n";
import type {MakingCommission} from "@/components/making/type";

export function CustomerBrief({ commission }: { commission: MakingCommission }) {
  const { locale, t } = useLocale();
  return (
    <>
      <h2>{locale === "fa" ? "مشخصات ارسال‌شده" : "Submitted specification"}</h2>
      <dl className="making-brief">
        <div>
          <dt>{locale === "fa" ? "مفهوم" : "Concept"}</dt>
          <dd>{commission.brief.concept}</dd>
        </div>
        <div>
          <dt>{locale === "fa" ? "ابعاد" : "Dimensions"}</dt>
          <dd>{commission.brief.dimensions}</dd>
        </div>
        <div>
          <dt>{locale === "fa" ? "ماده" : "Material"}</dt>
          <dd>{commission.brief.material}</dd>
        </div>
        <div>
          <dt>{locale === "fa" ? "کاربرد" : "Intended use"}</dt>
          <dd>{commission.brief.intendedUse}</dd>
        </div>
        <div>
          <dt>{locale === "fa" ? "بودجه" : "Budget"}</dt>
          <dd>{commission.brief.budget}</dd>
        </div>
        <div>
          <dt>{locale === "fa" ? "اجازه غافلگیری" : "Permission for surprise"}</dt>
          <dd>{commission.brief.permission}</dd>
        </div>
      </dl>
      {commission.brief.image ? (
        <img className="making-concept-image" src={commission.brief.image} alt={t("generatedAlt")} />
      ) : null}
    </>
  );
}
