"use client";
import "./customer-detail.css";

import { useEffect, useState, type ReactNode } from "react";
import { copy, formatWhen, isDemoCommission } from "@/lib/making";
import { useMaking } from "@/hooks/use-making-workspace";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { fetchCommission } from "@/lib/api";
import { AccountShell } from "../../account/account-shell";
import { CardListSkeleton } from "@/components/ui/skeleton";
import type { MakingCommission } from "@/components/making/type";
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
  const { get, ready } = useMaking();
  const { user } = useCommerce();
  const { locale, t } = useLocale();
  const demo = isDemoCommission(id);
  const [remote, setRemote] = useState<MakingCommission | undefined>();
  const commission = get(id) ?? remote;
  const wrap = (children: ReactNode) =>
    demo ? children : <AccountShell requireAuth>{children}</AccountShell>;

  useEffect(() => {
    if (demo || !user) return;
    let cancelled = false;
    fetchCommission(id)
      .then((item) => {
        if (!cancelled) setRemote(item);
      })
      .catch(() => {
        if (!cancelled) setRemote(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [demo, id, user]);

  if (!ready) {
    return wrap(
      <section className="making-page section">
        <CardListSkeleton count={2} />
      </section>,
    );
  }
  if (!commission) {
    return wrap(
      <section className="making-page section">
        <h1>{t("makingMissing")}</h1>
        <ButtonLink href="/account/making" outline>
          {t("makingBack")}
        </ButtonLink>
      </section>,
    );
  }
  const showProgress = commission.stage !== "complete" && commission.stage !== "shipping";
  const showRecord = commission.stage === "complete" || commission.stage === "shipping";
  const showSnapshot =
    Boolean(commission.approvedSnapshot) &&
    commission.stage !== "complete" &&
    commission.stage !== "shipping";

  return wrap(
    <section className="making-page making-detail section">
      <header className="making-heading">
        <span className="eyebrow">{demo ? t("customOrdersSampleTitle") : t("makingPathTitle")}</span>
        <h1>{copy(commission.title, locale)}</h1>
        <p>
          {commission.artistName} · {locale === "fa" ? "تخمین تکمیل" : "Est. completion"}{" "}
          {formatWhen(commission.estimatedCompletion, locale)}
        </p>
        {demo ? <p className="making-demo-banner">{t("makingDemoBanner")}</p> : null}
      </header>
      <SituationBanner commission={commission} />
      <BiographyRail commission={commission} />

      <div className="making-layout">
        <div className="making-main">
          <CustomerBrief commission={commission} />
          <ChangeCards commission={commission} />
          {demo ? null : <CustomerChangeActions commission={commission} />}
          <QuoteCard commission={commission} />
          {demo ? null : <CustomerDepositAction commission={commission} />}
          {showSnapshot ? <QuoteCard commission={commission} snapshot /> : null}
          {showProgress ? (
            <>
              <h2>{locale === "fa" ? "عکس‌های پیشرفت" : "Progress photographs"}</h2>
              <ProgressPhotographs commission={commission} />
            </>
          ) : null}
          <PreKilnCard commission={commission} />
          {demo ? null : <CustomerKilnAction commission={commission} />}
          {demo ? null : <CustomerFiringResolution commission={commission} />}
          {demo ? null : <CustomerBalanceAction commission={commission} />}
          {showRecord ? <RecordOfMaking commission={commission} /> : null}
        </div>
        <CustomerMakingSidebar commission={commission} readOnly={demo} />
      </div>
    </section>,
  );
}
