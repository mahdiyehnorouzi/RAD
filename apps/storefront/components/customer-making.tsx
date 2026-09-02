"use client";

import Link from "next/link";
import { useMaking } from "@/hooks/use-making-workspace";
import {
  copy,
  situationFor,
  type MakingCommission,
} from "@/lib/making-commission";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import {
  AuditTrail,
  BiographyRail,
  ChangeCards,
  MessageComposer,
  PaymentHistory,
  PreKilnCard,
  ProgressPhotographs,
  QuoteCard,
  RecordOfMaking,
  SituationBanner,
  StageMessages,
  formatWhen,
} from "./making-biography";

function CommissionCard({
  commission,
  hrefBase,
}: {
  commission: MakingCommission;
  hrefBase: string;
}) {
  const { locale, href } = useLocale();
  const situation = situationFor(commission);
  return (
    <article className="making-card">
      <header>
        <span className="eyebrow">{commission.id}</span>
        <h2>{copy(commission.title, locale)}</h2>
        <b>{copy(situation.headline, locale)}</b>
      </header>
      <p>{copy(situation.body, locale)}</p>
      <small>
        {copy(situation.actorLabel, locale)} · {locale === "fa" ? "تخمین تکمیل" : "Est. completion"}{" "}
        {formatWhen(commission.estimatedCompletion, locale)}
      </small>
      <Link className="button outline" href={href(`${hrefBase}/${commission.id}`)}>
        {locale === "fa" ? "گشودن مسیر ساخت" : "Open making path"}
      </Link>
    </article>
  );
}

export function CustomerMakingList() {
  const { commissions, ready } = useMaking();
  const { locale, t } = useLocale();
  if (!ready) return <section className="making-page section"><p>{locale === "fa" ? "در حال خواندن مسیرها…" : "Reading making paths…"}</p></section>;
  return (
    <section className="making-page section">
      <header className="making-heading">
        <span className="eyebrow">{t("makingEyebrow")}</span>
        <h1>{t("makingTitle")}</h1>
        <p>{t("makingBody")}</p>
      </header>
      {commissions.length ? (
        <div className="making-grid">
          {commissions.map((item) => (
            <CommissionCard key={item.id} commission={item} hrefBase="/making" />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>{t("makingEmpty")}</h2>
          <p>{t("makingEmptyBody")}</p>
          <ButtonLink href="/studio">{t("designMine")}</ButtonLink>
        </div>
      )}
    </section>
  );
}

export function CustomerMakingDetail({ id }: { id: string }) {
  const { get, customerApproveDeposit, customerApproveKiln, customerPayBalance, customerResolveChange, customerAcceptResolution, addMessage } =
    useMaking();
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
  const openChange = commission.changeRequests.find((item) => item.status === "open");
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

          <ChangeCards commission={commission} />
          {openChange && commission.nextActor === "customer" ? (
            <div className="making-actions">
              <button className="button" type="button" onClick={() => customerResolveChange(commission.id, true)}>
                {locale === "fa" ? "پذیرش تغییر" : "Accept the change"}
              </button>
              <button
                className="button outline"
                type="button"
                onClick={() => customerResolveChange(commission.id, false)}
              >
                {locale === "fa" ? "درخواست بدیل" : "Ask for an alternative"}
              </button>
            </div>
          ) : null}

          <QuoteCard commission={commission} />
          {commission.stage === "approval_deposit" && commission.quote ? (
            <div className="making-actions">
              <button className="button" type="button" onClick={() => customerApproveDeposit(commission.id)}>
                {locale === "fa" ? "پذیرش مشخصات و پرداخت بیعانه" : "Accept specification and pay deposit"}
              </button>
              <small>
                {locale === "fa"
                  ? "این نسخه نمایشی است؛ مبلغی از درگاه کم نمی‌شود. نسخه تأییدشده قفل می‌شود."
                  : "This is a prototype; no card is charged. The approved snapshot is locked."}
              </small>
            </div>
          ) : null}

          {commission.approvedSnapshot && commission.stage !== "complete" && commission.stage !== "shipping" ? (
            <QuoteCard commission={commission} snapshot />
          ) : null}

          {commission.stage !== "complete" && commission.stage !== "shipping" ? (
            <>
              <h2>{locale === "fa" ? "عکس‌های پیشرفت" : "Progress photographs"}</h2>
              <ProgressPhotographs commission={commission} />
            </>
          ) : null}

          <PreKilnCard commission={commission} />
          {commission.stage === "pre_kiln" && commission.nextActor === "customer" ? (
            <div className="making-actions">
              <button className="button" type="button" onClick={() => customerApproveKiln(commission.id)}>
                {locale === "fa" ? "تأیید ورود به کوره" : "Approve kiln entry"}
              </button>
              <small className="making-warning">
                {locale === "fa"
                  ? "پس از تأیید، فرم و لعاب دیگر تغییر نمی‌کنند."
                  : "After approval, form and glaze cannot be changed."}
              </small>
            </div>
          ) : null}

          {commission.firing?.unexpected && commission.stage === "firing" ? (
            <div className="making-actions">
              <p>
                {copy(
                  commission.firing.resolution ?? {
                    fa: "نتیجه از بازه فاصله گرفته است.",
                    en: "The result sits outside the approved range.",
                  },
                  locale,
                )}
              </p>
              <button className="button" type="button" onClick={() => customerAcceptResolution(commission.id)}>
                {locale === "fa" ? "پذیرش نتیجه و ادامه به رونمایی" : "Accept the result and continue to reveal"}
              </button>
            </div>
          ) : null}

          {commission.stage === "reveal" ? (
            <div className="making-actions">
              <button className="button" type="button" onClick={() => customerPayBalance(commission.id)}>
                {locale === "fa" ? "پرداخت مانده حساب" : "Pay remaining balance"}
              </button>
            </div>
          ) : null}

          {commission.stage === "complete" || commission.stage === "shipping" ? (
            <RecordOfMaking commission={commission} />
          ) : null}
        </div>

        <aside className="making-side">
          <h2>{locale === "fa" ? "پرداخت‌ها" : "Payments"}</h2>
          <PaymentHistory commission={commission} />
          <h2>{locale === "fa" ? "پیام‌های مرحله" : "Stage messages"}</h2>
          {commission.stage !== "complete" && commission.stage !== "shipping" ? (
            <StageMessages commission={commission} />
          ) : null}
          {commission.stage !== "complete" && commission.stage !== "declined" ? (
            <MessageComposer
              onSend={(body) => addMessage(commission.id, { author: "customer", body })}
            />
          ) : null}
        </aside>
      </div>
    </section>
  );
}
