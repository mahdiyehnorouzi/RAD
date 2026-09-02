"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useMaking } from "@/hooks/use-making-workspace";
import {
  copy,
  deadlineWarning,
  situationFor,
  STAGE_LABEL,
  workshopBucket,
  type MakingCommission,
  type PhotoKind,
} from "@/lib/making-commission";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import {
  asCopy,
  AuditTrail,
  BiographyRail,
  ChangeCards,
  formatWhen,
  MessageComposer,
  PaymentHistory,
  PreKilnCard,
  ProgressPhotographs,
  QuoteCard,
  SituationBanner,
  StageMessages,
} from "./making-biography";

function WorkshopCard({ commission }: { commission: MakingCommission }) {
  const { locale, href } = useLocale();
  const situation = situationFor(commission);
  const warning = deadlineWarning(commission);
  return (
    <article className={`workshop-card${warning ? " warn" : ""}`}>
      <header>
        <span>{commission.id}</span>
        {warning ? <b className="deadline">{locale === "fa" ? "مهلت نزدیک" : "Deadline soon"}</b> : null}
      </header>
      <h3>{copy(commission.title, locale)}</h3>
      <p>{copy(situation.headline, locale)}</p>
      <small>
        {commission.customerName} · {copy(STAGE_LABEL[commission.stage], locale)}
      </small>
      <Link className="button outline" href={href(`/workshop/${commission.id}`)}>
        {locale === "fa" ? "گشودن در کارگاه" : "Open in workshop"}
      </Link>
    </article>
  );
}

export function ArtistWorkshopBoard() {
  const { commissions, ready } = useMaking();
  const { locale, t } = useLocale();
  const grouped = useMemo(() => {
    const needs = commissions.filter((item) => workshopBucket(item) === "needs_artist");
    const waiting = commissions.filter((item) => workshopBucket(item) === "waiting_customer");
    const rest = commissions.filter((item) => {
      const bucket = workshopBucket(item);
      return bucket === "production" || bucket === "archive";
    });
    return { needs, waiting, rest };
  }, [commissions]);

  if (!ready) {
    return (
      <section className="workshop-page section">
        <p>{locale === "fa" ? "کارگاه در حال باز شدن است…" : "Opening the workshop…"}</p>
      </section>
    );
  }

  return (
    <section className="workshop-page section">
      <header className="making-heading">
        <span className="eyebrow">{t("workshopEyebrow")}</span>
        <h1>{t("workshopTitle")}</h1>
        <p>{t("workshopBody")}</p>
      </header>
      <div className="workshop-columns">
        <section>
          <h2>{t("workshopNeeds")}</h2>
          {grouped.needs.length ? grouped.needs.map((item) => <WorkshopCard key={item.id} commission={item} />) : <p className="making-empty">{t("workshopQuiet")}</p>}
        </section>
        <section>
          <h2>{t("workshopWaiting")}</h2>
          {grouped.waiting.length ? grouped.waiting.map((item) => <WorkshopCard key={item.id} commission={item} />) : <p className="making-empty">{t("workshopQuiet")}</p>}
        </section>
        <section>
          <h2>{t("workshopStages")}</h2>
          {grouped.rest.length ? grouped.rest.map((item) => <WorkshopCard key={item.id} commission={item} />) : <p className="making-empty">{t("workshopQuiet")}</p>}
        </section>
      </div>
    </section>
  );
}

export function ArtistWorkshopDetail({ id }: { id: string }) {
  const making = useMaking();
  const { locale, t } = useLocale();
  const commission = making.get(id);
  const [tab, setTab] = useState<"work" | "audit">("work");

  if (!commission) {
    return (
      <section className="workshop-page section">
        <h1>{t("makingMissing")}</h1>
        <ButtonLink href="/workshop" outline>
          {t("workshopBack")}
        </ButtonLink>
      </section>
    );
  }

  const warning = deadlineWarning(commission);

  return (
    <section className="workshop-page making-detail section">
      <header className="making-heading">
        <span className="eyebrow">{t("workshopEyebrow")}</span>
        <h1>{copy(commission.title, locale)}</h1>
        <p>
          {commission.customerName} · {commission.id}
          {warning ? ` · ${locale === "fa" ? "مهلت نزدیک است" : "Deadline approaching"}` : ""}
        </p>
      </header>
      <SituationBanner commission={commission} />
      <BiographyRail commission={commission} />
      <div className="workshop-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "work"} className={tab === "work" ? "active" : ""} onClick={() => setTab("work")}>
          {locale === "fa" ? "اقدام کارگاه" : "Workshop action"}
        </button>
        <button type="button" role="tab" aria-selected={tab === "audit"} className={tab === "audit" ? "active" : ""} onClick={() => setTab("audit")}>
          {locale === "fa" ? "رد تصمیم‌ها" : "Decision audit"}
        </button>
      </div>

      {tab === "audit" ? (
        <AuditTrail commission={commission} />
      ) : (
        <div className="making-layout">
          <div className="making-main">
            <FeasibilityPanel commission={commission} />
            <QuotePanel commission={commission} />
            <MakingPanel commission={commission} />
            <PreKilnPanel commission={commission} />
            <FiringPanel commission={commission} />
            <ShipPanel commission={commission} />
            <ChangeCards commission={commission} />
            <QuoteCard commission={commission} />
            {commission.approvedSnapshot ? <QuoteCard commission={commission} snapshot /> : null}
            <PreKilnCard commission={commission} />
            <ProgressPhotographs commission={commission} />
          </div>
          <aside className="making-side">
            <h2>{locale === "fa" ? "وضعیت پرداخت" : "Payment status"}</h2>
            <PaymentHistory commission={commission} />
            <h2>{locale === "fa" ? "پیام‌های مشتری" : "Customer messages"}</h2>
            <StageMessages commission={commission} />
            <MessageComposer
              onSend={(body) => making.addMessage(commission.id, { author: "artist", body })}
            />
            <h2>{locale === "fa" ? "یادداشت داخلی" : "Internal notes"}</h2>
            <StageMessages commission={commission} internalOnly />
            <MessageComposer
              internal
              onSend={(body) => making.addMessage(commission.id, { author: "artist", body, internal: true })}
            />
          </aside>
        </div>
      )}
    </section>
  );
}

function FeasibilityPanel({ commission }: { commission: MakingCommission }) {
  const { artistDecide } = useMaking();
  const { locale } = useLocale();
  const open = commission.stage === "design_submitted" || (commission.stage === "feasibility" && commission.nextActor === "artist" && !commission.changeRequests.some((item) => item.status === "open"));
  if (!open) return null;
  return (
    <form
      className="workshop-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const decision = String(data.get("decision"));
        if (decision === "approve") artistDecide(commission.id, "approve");
        if (decision === "decline") {
          artistDecide(commission.id, "decline", { reason: asCopy(String(data.get("reason") ?? "").trim() || (locale === "fa" ? "این طرح با ماده فعلی سازگار نیست." : "This design does not fit the current material.")) });
        }
        if (decision === "alternative") {
          artistDecide(commission.id, "offer_alternative", {
            alternative: asCopy(String(data.get("alternative") ?? "").trim()),
          });
        }
        if (decision === "change") {
          artistDecide(commission.id, "request_change", {
            change: {
              whatChanged: asCopy(String(data.get("what") ?? "")),
              whyNecessary: asCopy(String(data.get("why") ?? "")),
              priceImpact: asCopy(String(data.get("price") ?? "")),
              timeImpact: asCopy(String(data.get("time") ?? "")),
            },
          });
        }
      }}
    >
      <h2>{locale === "fa" ? "بازبینی امکان‌پذیری" : "Feasibility review"}</h2>
      <label htmlFor="decision">{locale === "fa" ? "تصمیم" : "Decision"}</label>
      <select id="decision" name="decision" defaultValue="approve">
        <option value="approve">{locale === "fa" ? "تأیید طرح" : "Approve the design"}</option>
        <option value="change">{locale === "fa" ? "درخواست تغییر مشخص" : "Request a specific change"}</option>
        <option value="alternative">{locale === "fa" ? "پیشنهاد بدیل" : "Offer an alternative"}</option>
        <option value="decline">{locale === "fa" ? "رد با دلیل" : "Decline with a reason"}</option>
      </select>
      <label htmlFor="what">{locale === "fa" ? "چه چیزی عوض می‌شود" : "What changes"}</label>
      <textarea id="what" name="what" className="resize-none" />
      <label htmlFor="why">{locale === "fa" ? "چرا لازم است" : "Why it is necessary"}</label>
      <textarea id="why" name="why" className="resize-none" />
      <label htmlFor="price">{locale === "fa" ? "اثر بر قیمت" : "Price effect"}</label>
      <input id="price" name="price" />
      <label htmlFor="time">{locale === "fa" ? "اثر بر زمان" : "Delivery effect"}</label>
      <input id="time" name="time" />
      <label htmlFor="alternative">{locale === "fa" ? "بدیل" : "Alternative"}</label>
      <textarea id="alternative" name="alternative" className="resize-none" />
      <label htmlFor="reason">{locale === "fa" ? "دلیل رد" : "Decline reason"}</label>
      <textarea id="reason" name="reason" className="resize-none" />
      <button className="button" type="submit">
        {locale === "fa" ? "ثبت تصمیم هنرمند" : "Record artist decision"}
      </button>
    </form>
  );
}

function QuotePanel({ commission }: { commission: MakingCommission }) {
  const { artistSendQuote } = useMaking();
  const { locale } = useLocale();
  if (commission.stage !== "quote") return null;
  return (
    <form
      className="workshop-form"
      noValidate
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const priceToman = Number(data.get("priceToman"));
        const priceUsd = Number(data.get("priceUsd"));
        const depositToman = Number(data.get("depositToman"));
        const depositUsd = Number(data.get("depositUsd"));
        artistSendQuote(commission.id, {
          specification: asCopy(String(data.get("specification") ?? "")),
          artistName: commission.artistName,
          priceToman,
          priceUsd,
          depositToman,
          depositUsd,
          completionWindow: asCopy(String(data.get("window") ?? "")),
          includedRevisions: Number(data.get("revisions") || 1),
          cancellationRules: asCopy(String(data.get("cancel") ?? "")),
          createdAt: Date.now(),
        });
      }}
    >
      <h2>{locale === "fa" ? "نوشتن پیشنهاد" : "Write the proposal"}</h2>
      <label htmlFor="specification">{locale === "fa" ? "مشخصات نهایی" : "Final specification"}</label>
      <textarea id="specification" name="specification" className="resize-none" required defaultValue={commission.brief.concept} />
      <label htmlFor="priceToman">{locale === "fa" ? "قیمت (تومان)" : "Price (toman)"}</label>
      <input id="priceToman" name="priceToman" type="number" defaultValue={18400000} />
      <label htmlFor="priceUsd">{locale === "fa" ? "قیمت (دلار)" : "Price (USD)"}</label>
      <input id="priceUsd" name="priceUsd" type="number" defaultValue={220} />
      <label htmlFor="depositToman">{locale === "fa" ? "بیعانه (تومان)" : "Deposit (toman)"}</label>
      <input id="depositToman" name="depositToman" type="number" defaultValue={9200000} />
      <label htmlFor="depositUsd">{locale === "fa" ? "بیعانه (دلار)" : "Deposit (USD)"}</label>
      <input id="depositUsd" name="depositUsd" type="number" defaultValue={110} />
      <label htmlFor="window">{locale === "fa" ? "پنجره تکمیل" : "Completion window"}</label>
      <input id="window" name="window" defaultValue={locale === "fa" ? "چهار تا شش هفته از بیعانه" : "Four to six weeks from deposit"} />
      <label htmlFor="revisions">{locale === "fa" ? "تعداد بازبینی شامل" : "Included revisions"}</label>
      <input id="revisions" name="revisions" type="number" defaultValue={1} />
      <label htmlFor="cancel">{locale === "fa" ? "لغو و استرداد" : "Cancellation and refunds"}</label>
      <textarea
        id="cancel"
        name="cancel"
        className="resize-none"
        defaultValue={
          locale === "fa"
            ? "پیش از کوره، بیعانه پس از کسر مواد قابل استرداد است. پس از کوره برگشت‌ناپذیر است."
            : "Before the kiln, the deposit is refundable minus materials. After kiln entry it is not refundable."
        }
      />
      <button className="button" type="submit">
        {locale === "fa" ? "ارسال پیشنهاد برای مشتری" : "Send proposal to the customer"}
      </button>
    </form>
  );
}

function MakingPanel({ commission }: { commission: MakingCommission }) {
  const { artistPublishUpdate, artistOpenPreKiln } = useMaking();
  const { locale } = useLocale();
  if (commission.stage !== "making") return null;
  return (
    <div className="workshop-stack">
      <form
        className="workshop-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          artistPublishUpdate(commission.id, {
            note: asCopy(String(data.get("note") ?? "")),
            photoKind: String(data.get("photo")) as PhotoKind,
          });
          event.currentTarget.reset();
        }}
      >
        <h2>{locale === "fa" ? "به‌روزرسانی ساخت" : "Making update"}</h2>
        <p>
          {locale === "fa"
            ? "هر یادداشت نیاز به تأیید مشتری ندارد."
            : "Not every note needs customer approval."}
        </p>
        <label htmlFor="photo">{locale === "fa" ? "گونه عکس" : "Photograph kind"}</label>
        <select id="photo" name="photo" defaultValue="forming">
          <option value="forming">{locale === "fa" ? "فرم‌دهی" : "Forming"}</option>
          <option value="cleaned">{locale === "fa" ? "فرم پاک‌شده" : "Cleaned form"}</option>
          <option value="glaze">{locale === "fa" ? "لعاب" : "Glaze"}</option>
        </select>
        <label htmlFor="note">{locale === "fa" ? "یادداشت کوتاه" : "Short note"}</label>
        <textarea id="note" name="note" className="resize-none" required />
        <button className="button" type="submit">
          {locale === "fa" ? "انتشار برای مشتری" : "Publish to the customer"}
        </button>
      </form>
      <form
        className="workshop-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          artistOpenPreKiln(commission.id, {
            dimensions: asCopy(String(data.get("dimensions") ?? "")),
            glazeCode: String(data.get("glazeCode") ?? "G-17"),
            glazeName: asCopy(String(data.get("glazeName") ?? "")),
            colorRange: asCopy(String(data.get("colorRange") ?? "")),
            testTileNote: asCopy(String(data.get("tile") ?? "")),
            createdAt: Date.now(),
          });
        }}
      >
        <h2>{locale === "fa" ? "باز کردن ایستگاه پیش از کوره" : "Open pre-kiln checkpoint"}</h2>
        <label htmlFor="dimensions">{locale === "fa" ? "ابعاد فرم" : "Form dimensions"}</label>
        <input id="dimensions" name="dimensions" required />
        <label htmlFor="glazeCode">{locale === "fa" ? "کد لعاب" : "Glaze code"}</label>
        <input id="glazeCode" name="glazeCode" defaultValue="G-17" />
        <label htmlFor="glazeName">{locale === "fa" ? "نام لعاب" : "Glaze name"}</label>
        <input id="glazeName" name="glazeName" />
        <label htmlFor="colorRange">{locale === "fa" ? "بازه رنگ مورد انتظار" : "Expected colour range"}</label>
        <textarea id="colorRange" name="colorRange" className="resize-none" />
        <label htmlFor="tile">{locale === "fa" ? "یادداشت کاشی آزمایشی" : "Test-tile note"}</label>
        <textarea id="tile" name="tile" className="resize-none" />
        <button className="button" type="submit">
          {locale === "fa" ? "درخواست تأیید مشتری" : "Request customer approval"}
        </button>
      </form>
    </div>
  );
}

function PreKilnPanel({ commission }: { commission: MakingCommission }) {
  const { locale } = useLocale();
  if (commission.stage !== "pre_kiln") return null;
  return (
    <p className="making-empty">
      {locale === "fa"
        ? "منتظر تأیید مشتری برای کوره. این مرحله برگشت‌ناپذیر خواهد شد."
        : "Waiting for the customer to approve the kiln. This step will become irreversible."}
    </p>
  );
}

function FiringPanel({ commission }: { commission: MakingCommission }) {
  const { artistRecordFiring } = useMaking();
  const { locale } = useLocale();
  if (commission.stage !== "firing" || commission.firing) return null;
  return (
    <form
      className="workshop-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const unexpected = data.get("unexpected") === "on";
        artistRecordFiring(commission.id, {
          firingNote: asCopy(String(data.get("firing") ?? "")),
          finishingNote: asCopy(String(data.get("finishing") ?? "")),
          qcNote: asCopy(String(data.get("qc") ?? "")),
          unexpected,
          resolution: unexpected ? asCopy(String(data.get("resolution") ?? "")) : undefined,
          createdAt: Date.now(),
        });
      }}
    >
      <h2>{locale === "fa" ? "ثبت پخت و پرداخت" : "Record firing and finishing"}</h2>
      <label htmlFor="firing">{locale === "fa" ? "پخت" : "Firing"}</label>
      <textarea id="firing" name="firing" className="resize-none" required />
      <label htmlFor="finishing">{locale === "fa" ? "پرداخت" : "Finishing"}</label>
      <textarea id="finishing" name="finishing" className="resize-none" />
      <label htmlFor="qc">{locale === "fa" ? "کنترل کیفیت" : "Quality control"}</label>
      <textarea id="qc" name="qc" className="resize-none" />
      <label className="making-check">
        <input type="checkbox" name="unexpected" />
        {locale === "fa"
          ? "نتیجه از بازه تأییدشده فاصله گرفته است"
          : "Result differs materially from the approved range"}
      </label>
      <label htmlFor="resolution">{locale === "fa" ? "پیشنهاد حل اختلاف" : "Resolution proposal"}</label>
      <textarea id="resolution" name="resolution" className="resize-none" />
      <button className="button" type="submit">
        {locale === "fa" ? "ثبت نتیجه پخت" : "Record firing result"}
      </button>
    </form>
  );
}

function ShipPanel({ commission }: { commission: MakingCommission }) {
  const { artistShip, artistPublishUpdate } = useMaking();
  const { locale } = useLocale();
  if (commission.stage !== "shipping") return null;
  return (
    <form
      className="workshop-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        artistPublishUpdate(commission.id, {
          note: asCopy(locale === "fa" ? "بسته‌بندی انجام شد." : "Packaging complete."),
          photoKind: "packed",
        });
        artistShip(commission.id, String(data.get("tracking") ?? "").trim());
      }}
    >
      <h2>{locale === "fa" ? "ارسال" : "Shipping"}</h2>
      <label htmlFor="tracking">{locale === "fa" ? "شماره رهگیری" : "Tracking number"}</label>
      <input id="tracking" name="tracking" required />
      <button className="button" type="submit">
        {locale === "fa" ? "ثبت ارسال و بستن رکورد" : "Mark shipped and close the record"}
      </button>
    </form>
  );
}
