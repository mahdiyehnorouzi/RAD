"use client";

import {
  BIOGRAPHY_STAGES,
  copy,
  moneyFor,
  situationFor,
  stageIndex,
  STAGE_LABEL,
  type LocaleCopy,
  type MakingCommission,
  type MakingStageId,
  type PhotoKind,
} from "@/lib/making-commission";
import { useLocale } from "@/components/i18n";

export function asCopy(value: string): LocaleCopy {
  return { fa: value, en: value };
}

export function formatWhen(value: number, locale: "fa" | "en") {
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    dateStyle: "medium",
  }).format(value);
}

const photoLabel: Record<PhotoKind, LocaleCopy> = {
  concept: { fa: "تصویر نیت", en: "Intention image" },
  forming: { fa: "فرم‌دهی", en: "Forming" },
  cleaned: { fa: "فرم پاک‌شده", en: "Cleaned form" },
  glaze: { fa: "مرجع لعاب", en: "Glaze reference" },
  tile: { fa: "کاشی آزمایشی", en: "Test tile" },
  fired: { fa: "پس از پخت", en: "After firing" },
  finished: { fa: "تمام‌شده", en: "Finished" },
  packed: { fa: "بسته‌بندی", en: "Packed" },
};

export function SituationBanner({ commission }: { commission: MakingCommission }) {
  const { locale } = useLocale();
  const situation = situationFor(commission);
  return (
    <aside className="making-situation" aria-live="polite">
      <span className="eyebrow">{copy(situation.stageLabel, locale)}</span>
      <h2>{copy(situation.headline, locale)}</h2>
      <p>{copy(situation.body, locale)}</p>
      <dl>
        <div>
          <dt>{locale === "fa" ? "چه کسی بعد عمل می‌کند؟" : "Who acts next?"}</dt>
          <dd>{copy(situation.actorLabel, locale)}</dd>
        </div>
        <div>
          <dt>{locale === "fa" ? "بعد از آن چه می‌شود؟" : "What happens after?"}</dt>
          <dd>{copy(situation.nextLabel, locale)}</dd>
        </div>
      </dl>
    </aside>
  );
}

export function BiographyRail({ commission }: { commission: MakingCommission }) {
  const { locale, number } = useLocale();
  const current = stageIndex(commission.stage);
  const stages =
    commission.stage === "declined"
      ? (["design_submitted", "feasibility", "declined"] as MakingStageId[])
      : BIOGRAPHY_STAGES;
  return (
    <ol className="making-rail" aria-label={locale === "fa" ? "زندگی‌نامه ساخت" : "Making biography"}>
      {stages.map((stage, index) => {
        const done =
          commission.stage === "declined"
            ? stage !== "declined"
            : current > index || commission.stage === "complete";
        const active = commission.stage === stage;
        return (
          <li
            key={stage}
            className={active ? "active" : done ? "done" : ""}
            aria-current={active ? "step" : undefined}
          >
            <i>{number(index + 1)}</i>
            <span>{copy(STAGE_LABEL[stage], locale)}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function ProgressPhotographs({
  commission,
  forStage,
}: {
  commission: MakingCommission;
  forStage?: MakingStageId;
}) {
  const { locale } = useLocale();
  const photos = commission.updates.filter((item) => !forStage || item.stageId === forStage);
  if (!photos.length) return null;
  return (
    <ul className="making-photos">
      {photos.map((item) => (
        <li key={item.id}>
          <div className={`making-swatch kind-${item.photoKind}`} aria-hidden="true" />
          <small>{copy(photoLabel[item.photoKind], locale)}</small>
          <p>{copy(item.note, locale)}</p>
          <time dateTime={new Date(item.createdAt).toISOString()}>
            {formatWhen(item.createdAt, locale)}
          </time>
        </li>
      ))}
    </ul>
  );
}

export function StageMessages({
  commission,
  revealInternal = false,
  internalOnly = false,
}: {
  commission: MakingCommission;
  revealInternal?: boolean;
  internalOnly?: boolean;
}) {
  const { locale } = useLocale();
  const items = (
    internalOnly
      ? commission.internalNotes
      : [...commission.messages, ...(revealInternal ? commission.internalNotes : [])]
  ).sort((a, b) => a.createdAt - b.createdAt);
  if (!items.length) {
    return (
      <p className="making-empty">
        {locale === "fa"
          ? "هنوز پیامی به این مسیر وصل نشده است."
          : "No messages are attached to this biography yet."}
      </p>
    );
  }
  return (
    <ol className="making-messages">
      {items.map((item) => (
        <li key={item.id} className={item.internal ? "internal" : item.author}>
          <header>
            <b>
              {item.internal
                ? locale === "fa"
                  ? "یادداشت داخلی"
                  : "Internal note"
                : item.author === "artist"
                  ? commission.artistName
                  : commission.customerName}
            </b>
            <span>{copy(STAGE_LABEL[item.stageId], locale)}</span>
            <time>{formatWhen(item.createdAt, locale)}</time>
          </header>
          <p>{copy(item.body, locale)}</p>
        </li>
      ))}
    </ol>
  );
}

export function QuoteCard({
  commission,
  snapshot = false,
}: {
  commission: MakingCommission;
  snapshot?: boolean;
}) {
  const { locale } = useLocale();
  const quote = snapshot ? commission.approvedSnapshot?.quote : commission.quote;
  if (!quote) return null;
  const rows = [
    [locale === "fa" ? "مشخصات نهایی" : "Final specification", copy(quote.specification, locale)],
    [locale === "fa" ? "هنرمند" : "Artist", quote.artistName],
    [locale === "fa" ? "قیمت" : "Price", moneyFor(commission, locale, quote.priceToman, quote.priceUsd)],
    [
      locale === "fa" ? "بیعانه" : "Deposit",
      moneyFor(commission, locale, quote.depositToman, quote.depositUsd),
    ],
    [
      locale === "fa" ? "مانده" : "Remaining balance",
      moneyFor(
        commission,
        locale,
        quote.priceToman - quote.depositToman,
        quote.priceUsd - quote.depositUsd,
      ),
    ],
    [locale === "fa" ? "پنجره تکمیل" : "Completion window", copy(quote.completionWindow, locale)],
    [
      locale === "fa" ? "بازبینی‌های شامل" : "Included revisions",
      String(quote.includedRevisions),
    ],
    [locale === "fa" ? "لغو و استرداد" : "Cancellation and refunds", copy(quote.cancellationRules, locale)],
  ];
  return (
    <article className={`making-quote${snapshot ? " snapshot" : ""}`}>
      <header>
        <span className="eyebrow">
          {snapshot
            ? locale === "fa"
              ? "نسخه تأییدشده"
              : "Approved snapshot"
            : locale === "fa"
              ? "پیشنهاد ساخت"
              : "Making proposal"}
        </span>
        {snapshot && commission.approvedSnapshot ? (
          <time>{formatWhen(commission.approvedSnapshot.approvedAt, locale)}</time>
        ) : null}
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={String(label)}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export function PaymentHistory({ commission }: { commission: MakingCommission }) {
  const { locale } = useLocale();
  if (!commission.payments.length) return null;
  return (
    <ul className="making-payments">
      {commission.payments.map((item) => (
        <li key={item.id} className={item.status}>
          <b>
            {item.kind === "deposit"
              ? locale === "fa"
                ? "بیعانه"
                : "Deposit"
              : locale === "fa"
                ? "مانده حساب"
                : "Balance"}
          </b>
          <span>{moneyFor(commission, locale, item.amountToman, item.amountUsd)}</span>
          <small>
            {item.status === "paid"
              ? `${locale === "fa" ? "پرداخت‌شده" : "Paid"}${item.at ? ` · ${formatWhen(item.at, locale)}` : ""}`
              : locale === "fa"
                ? "سررسید"
                : "Due"}
          </small>
        </li>
      ))}
    </ul>
  );
}

export function ChangeCards({ commission }: { commission: MakingCommission }) {
  const { locale } = useLocale();
  if (!commission.changeRequests.length) return null;
  return (
    <div className="making-changes">
      {commission.changeRequests.map((item) => (
        <article key={item.id}>
          <span className="eyebrow">
            {item.status === "open"
              ? locale === "fa"
                ? "تغییر باز"
                : "Open change"
              : item.status === "accepted"
                ? locale === "fa"
                  ? "پذیرفته‌شده"
                  : "Accepted"
                : locale === "fa"
                  ? "بسته"
                  : "Closed"}
          </span>
          <dl>
            <div>
              <dt>{locale === "fa" ? "چه چیزی عوض می‌شود" : "What changes"}</dt>
              <dd>{copy(item.whatChanged, locale)}</dd>
            </div>
            <div>
              <dt>{locale === "fa" ? "چرا لازم است" : "Why it is necessary"}</dt>
              <dd>{copy(item.whyNecessary, locale)}</dd>
            </div>
            <div>
              <dt>{locale === "fa" ? "اثر بر قیمت" : "Price effect"}</dt>
              <dd>{copy(item.priceImpact, locale)}</dd>
            </div>
            <div>
              <dt>{locale === "fa" ? "اثر بر زمان" : "Delivery effect"}</dt>
              <dd>{copy(item.timeImpact, locale)}</dd>
            </div>
            {item.alternative ? (
              <div>
                <dt>{locale === "fa" ? "بدیل" : "Alternative"}</dt>
                <dd>{copy(item.alternative, locale)}</dd>
              </div>
            ) : null}
          </dl>
        </article>
      ))}
    </div>
  );
}

export function PreKilnCard({ commission }: { commission: MakingCommission }) {
  const { locale } = useLocale();
  if (!commission.preKiln) return null;
  const item = commission.preKiln;
  return (
    <article className="making-kiln">
      <span className="eyebrow">{locale === "fa" ? "ایستگاه پیش از کوره" : "Pre-kiln checkpoint"}</span>
      <p className="making-warning">
        {locale === "fa"
          ? "رنگ دقیقاً همین نخواهد بود. پخت سرامیک بازه می‌سازد، نه تطابق. ورود به کوره برگشت‌ناپذیر است."
          : "It will not be exactly this colour. Firing creates a range, not a match. The kiln step is irreversible."}
      </p>
      <dl>
        <div>
          <dt>{locale === "fa" ? "ابعاد فرم‌گرفته" : "Formed dimensions"}</dt>
          <dd>{copy(item.dimensions, locale)}</dd>
        </div>
        <div>
          <dt>{locale === "fa" ? "لعاب" : "Glaze"}</dt>
          <dd>
            {item.glazeCode} — {copy(item.glazeName, locale)}
          </dd>
        </div>
        <div>
          <dt>{locale === "fa" ? "بازه رنگ مورد انتظار" : "Expected colour range"}</dt>
          <dd>{copy(item.colorRange, locale)}</dd>
        </div>
        <div>
          <dt>{locale === "fa" ? "کاشی آزمایشی" : "Test tile"}</dt>
          <dd>{copy(item.testTileNote, locale)}</dd>
        </div>
      </dl>
    </article>
  );
}

export function RecordOfMaking({ commission }: { commission: MakingCommission }) {
  const { locale } = useLocale();
  return (
    <section className="making-record">
      <header>
        <span className="eyebrow">
          {locale === "fa" ? "رکورد ساخت" : "Record of Making"}
        </span>
        <h2>{copy(commission.title, locale)}</h2>
        <p>
          {locale === "fa"
            ? "گفت‌وگو، تصمیم‌ها، مرجع لعاب، نتیجه پخت و عکس‌ها زندگی‌نامه این قطعه هستند."
            : "Conversation, decisions, glaze reference, firing result, and photographs are this piece’s biography."}
        </p>
      </header>
      {commission.tracking ? (
        <p className="making-tracking">
          {locale === "fa" ? "رهگیری ارسال" : "Shipment tracking"}: {commission.tracking}
        </p>
      ) : null}
      <QuoteCard commission={commission} snapshot />
      <PreKilnCard commission={commission} />
      {commission.firing ? (
        <dl className="making-firing">
          <div>
            <dt>{locale === "fa" ? "پخت" : "Firing"}</dt>
            <dd>{copy(commission.firing.firingNote, locale)}</dd>
          </div>
          <div>
            <dt>{locale === "fa" ? "پرداخت" : "Finishing"}</dt>
            <dd>{copy(commission.firing.finishingNote, locale)}</dd>
          </div>
          <div>
            <dt>{locale === "fa" ? "کنترل کیفیت" : "Quality control"}</dt>
            <dd>{copy(commission.firing.qcNote, locale)}</dd>
          </div>
        </dl>
      ) : null}
      <ProgressPhotographs commission={commission} />
      <StageMessages commission={commission} />
    </section>
  );
}

export function AuditTrail({ commission }: { commission: MakingCommission }) {
  const { locale } = useLocale();
  return (
    <ol className="making-audit">
      {[...commission.audit].reverse().map((item) => (
        <li key={item.id}>
          <time>{formatWhen(item.at, locale)}</time>
          <b>{copy(item.action, locale)}</b>
          <span>
            {item.actor === "artist"
              ? commission.artistName
              : item.actor === "customer"
                ? commission.customerName
                : locale === "fa"
                  ? "سیستم"
                  : "System"}
            {" · "}
            {copy(STAGE_LABEL[item.stageId], locale)}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function MessageComposer({
  onSend,
  internal = false,
}: {
  onSend: (body: LocaleCopy) => void;
  internal?: boolean;
}) {
  const { locale } = useLocale();
  return (
    <form
      className="making-compose"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const text = String(data.get("body") ?? "").trim();
        if (!text) return;
        onSend(asCopy(text));
        event.currentTarget.reset();
      }}
    >
      <label htmlFor={internal ? "internal-note" : "stage-message"}>
        {internal
          ? locale === "fa"
            ? "یادداشت داخلی (برای مشتری دیده نمی‌شود)"
            : "Internal note (invisible to the customer)"
          : locale === "fa"
            ? "پیام این مرحله"
            : "Message for this stage"}
      </label>
      <textarea id={internal ? "internal-note" : "stage-message"} name="body" className="resize-none" />
      <button className="button" type="submit">
        {internal
          ? locale === "fa"
            ? "ثبت یادداشت"
            : "Save note"
          : locale === "fa"
            ? "چسباندن به این مرحله"
            : "Attach to this stage"}
      </button>
    </form>
  );
}
