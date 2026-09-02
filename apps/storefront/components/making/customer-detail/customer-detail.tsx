"use client";

import { copy } from "@/lib/making";
import { formatWhen } from "@/lib/making";
import { useMaking } from "@/hooks/use-making-workspace";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import {
  BiographyRail,
  ChangeCards,
  PreKilnCard,
  ProgressPhotographs,
  QuoteCard,
  SituationBanner,
} from "../record";
import { CustomerBrief } from "./customer-brief";
import { CustomerMakingSidebar } from "./customer-sidebar";
import { RecordOfMaking } from "./record-of-making";
import {
  CustomerBalanceAction,
  CustomerChangeActions,
  CustomerDepositAction,
  CustomerFiringResolution,
  CustomerKilnAction,
} from "./customer-actions";

export function CustomerMakingDetail({ id }: { id: string }) {
  const { get } = useMaking();
  const { locale, t } = useLocale();
  const commission = get(id);
  if (!commission) {
    return (
      <section className="making-page section">
        <h1>{t("makingMissing")}</h1>
        <ButtonLink href="/making" outline>
          {t("makingBack")}
        </ButtonLink>
      </section>
    );
  }
  const showProgress = commission.stage !== "complete" && commission.stage !== "shipping";
  const showRecord = commission.stage === "complete" || commission.stage === "shipping";
  const showSnapshot =
    Boolean(commission.approvedSnapshot) &&
    commission.stage !== "complete" &&
    commission.stage !== "shipping";

  return (
    <section className="making-page making-detail section">
      <header className="making-heading">
        <span className="eyebrow">{commission.id}</span>
        <h1>{copy(commission.title, locale)}</h1>
        <p>
          {commission.artistName} · {locale === "fa" ? "تخمین تکمیل" : "Est. completion"}{" "}
          {formatWhen(commission.estimatedCompletion, locale)}
        </p>
      </header>
      <SituationBanner commission={commission} />
      <BiographyRail commission={commission} />

      <div className="making-layout">
        <div className="making-main">
          <CustomerBrief commission={commission} />
          <ChangeCards commission={commission} />
          <CustomerChangeActions commission={commission} />
          <QuoteCard commission={commission} />
          <CustomerDepositAction commission={commission} />
          {showSnapshot ? <QuoteCard commission={commission} snapshot /> : null}
          {showProgress ? (
            <>
              <h2>{locale === "fa" ? "عکس‌های پیشرفت" : "Progress photographs"}</h2>
              <ProgressPhotographs commission={commission} />
            </>
          ) : null}
          <PreKilnCard commission={commission} />
          <CustomerKilnAction commission={commission} />
          <CustomerFiringResolution commission={commission} />
          <CustomerBalanceAction commission={commission} />
          {showRecord ? <RecordOfMaking commission={commission} /> : null}
        </div>
        <CustomerMakingSidebar commission={commission} />
      </div>
    </section>
  );
}
