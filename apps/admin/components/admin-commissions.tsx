"use client";

import { useMemo, useState } from "react";
import { commissionStageLabels, commissionStageOrder, stageCountLabel, type AdminCommission } from "../lib/admin-data";
import { StageMeter } from "@rad/ui";

const copy = (value: { fa: string; en: string }) => value.fa;
const date = (value: number) => new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(value);

export function AdminCommissions({
  commissions,
  canWrite,
  onDecide,
  onMessage,
}: {
  commissions: AdminCommission[];
  canWrite: boolean;
  onDecide: (input: {
    id: string;
    decision: "approve" | "request_change" | "offer_alternative" | "decline";
    reason?: { fa: string; en: string };
    alternative?: { fa: string; en: string };
    change?: {
      whatChanged: { fa: string; en: string };
      whyNecessary: { fa: string; en: string };
      priceImpact: { fa: string; en: string };
      timeImpact: { fa: string; en: string };
    };
  }) => Promise<unknown>;
  onMessage: (id: string, body: { fa: string; en: string }, internal?: boolean) => Promise<unknown>;
}) {
  const inbox = useMemo(
    () => commissions.filter((item) => item.stage === "design_submitted" || item.stage === "feasibility"),
    [commissions],
  );
  const [selectedId, setSelectedId] = useState<string | null>(inbox[0]?.id ?? commissions[0]?.id ?? null);
  const selected = commissions.find((item) => item.id === selectedId) ?? null;

  return (
    <section className="paper-panel data-view commission-view">
      <div className="view-heading">
        <div>
          <span className="eyebrow">دفتر کوره</span>
          <h2>سفارش اختصاصی</h2>
          <p>
            سفارش اختصاصی خرید اثر آماده نیست؛ یک قطعه‌ی یک‌به‌یک است که پس از تأیید شما ساخته می‌شود. پیام‌ها و تصمیم بازبینی همین‌جا ثبت می‌شوند و مشتری در مسیر ساخت و اعلان‌ها می‌بیند.
          </p>
        </div>
      </div>
      <div className="commission-layout">
        <div className="commission-list">
          <h3>صندوق بازبینی</h3>
          {commissions.length ? (
            commissions.map((item) => {
              const meter = commissionMeter(item);
              return (
              <button
                key={item.id}
                type="button"
                className={item.id === selectedId ? "active" : ""}
                onClick={() => setSelectedId(item.id)}
              >
                <strong>{item.customerName}</strong>
                <span>{item.concept}</span>
                <small>
                  {item.id} · {commissionStageLabels[item.stage]}
                </small>
                <StageMeter
                  index={meter.index}
                  total={meter.total}
                  label={meter.label}
                  countLabel={stageCountLabel(meter.index, meter.total)}
                  kicker="مرحله فعلی"
                  nextKicker="مرحله بعد"
                  nextLabel={meter.nextLabel}
                  compact
                />
              </button>
              );
            })
          ) : (
            <p className="commission-empty">هنوز سفارش اختصاصی‌ای ارسال نشده است.</p>
          )}
        </div>
        {selected ? (
          <CommissionDetail commission={selected} canWrite={canWrite} onDecide={onDecide} onMessage={onMessage} />
        ) : (
          <div className="commission-empty-detail">یک سفارش را از فهرست انتخاب کنید.</div>
        )}
      </div>
    </section>
  );
}

function asCopy(value: string) {
  return { fa: value, en: value };
}

function commissionMeter(commission: AdminCommission) {
  if (commission.stage === "declined") {
    return { index: 2, total: 3, label: commissionStageLabels.declined };
  }
  const index = Math.max(0, commissionStageOrder.indexOf(commission.stage));
  const next = commissionStageOrder[index + 1];
  return {
    index,
    total: commissionStageOrder.length,
    label: commissionStageLabels[commission.stage],
    nextLabel: next ? commissionStageLabels[next] : undefined,
  };
}

function CommissionDetail({
  commission,
  canWrite,
  onDecide,
  onMessage,
}: {
  commission: AdminCommission;
  canWrite: boolean;
  onDecide: Parameters<typeof AdminCommissions>[0]["onDecide"];
  onMessage: Parameters<typeof AdminCommissions>[0]["onMessage"];
}) {
  const [decision, setDecision] = useState<"approve" | "request_change" | "offer_alternative" | "decline">("approve");
  const [reason, setReason] = useState("");
  const [alternative, setAlternative] = useState("");
  const [what, setWhat] = useState("");
  const [why, setWhy] = useState("");
  const [price, setPrice] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const open =
    commission.stage === "design_submitted" ||
    (commission.stage === "feasibility" && commission.nextActor === "artist");

  const meter = commissionMeter(commission);

  return (
    <div className="commission-detail">
      <header>
        <span className="eyebrow">{commissionStageLabels[commission.stage]}</span>
        <h3>{commission.concept}</h3>
        <p>
          {commission.customerName} · {commission.material || "ماده ثبت نشده"} · {commission.intendedUse || "کاربرد ثبت نشده"}
        </p>
      </header>
      <StageMeter
        index={meter.index}
        total={meter.total}
        label={meter.label}
        countLabel={stageCountLabel(meter.index, meter.total)}
        kicker="مرحله فعلی"
        nextKicker="مرحله بعد"
        nextLabel={meter.nextLabel}
      />
      {commission.image ? <img className="commission-image" src={commission.image} alt="" /> : null}
      <ol className="commission-thread">
        {commission.messages.length ? (
          commission.messages.map((item) => (
            <li key={item.id} className={item.author}>
              <b>{item.author === "artist" ? "کارگاه" : commission.customerName}</b>
              <span>{date(item.createdAt)}</span>
              <p>{copy(item.body)}</p>
            </li>
          ))
        ) : (
          <li>
            <p>هنوز پیامی رد و بدل نشده. تصمیم یا پیام شما برای مشتری در مسیر ساخت ظاهر می‌شود.</p>
          </li>
        )}
      </ol>
      <form
        className="commission-message"
        onSubmit={(event) => {
          event.preventDefault();
          if (!message.trim() || !canWrite) return;
          void onMessage(commission.id, asCopy(message.trim())).then(() => setMessage(""));
        }}
      >
        <label htmlFor="studio-message">پیام به مشتری</label>
        <textarea id="studio-message" value={message} onChange={(event) => setMessage(event.target.value)} rows={3} />
        <button className="secondary-action" type="submit" disabled={!canWrite || !message.trim()}>
          ارسال پیام
        </button>
      </form>
      {open ? (
        <form
          className="commission-decide"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canWrite) return;
            void onDecide({
              id: commission.id,
              decision,
              reason: reason.trim() ? asCopy(reason.trim()) : undefined,
              alternative: alternative.trim() ? asCopy(alternative.trim()) : undefined,
              change:
                decision === "request_change"
                  ? {
                      whatChanged: asCopy(what.trim() || "جزئیات ساخت باید عوض شود."),
                      whyNecessary: asCopy(why.trim() || "با ماده فعلی قابل ساخت نیست."),
                      priceImpact: asCopy(price.trim() || "بدون تغییر قیمت"),
                      timeImpact: asCopy(time.trim() || "بدون تغییر زمان"),
                    }
                  : undefined,
            });
          }}
        >
          <h4>تصمیم بازبینی</h4>
          <label htmlFor="decision">تصمیم</label>
          <select id="decision" value={decision} onChange={(event) => setDecision(event.target.value as typeof decision)}>
            <option value="approve">تأیید طرح</option>
            <option value="request_change">درخواست تغییر مشخص</option>
            <option value="offer_alternative">پیشنهاد بدیل</option>
            <option value="decline">رد با دلیل</option>
          </select>
          {decision === "request_change" ? (
            <>
              <label htmlFor="what">چه چیزی عوض می‌شود</label>
              <textarea id="what" value={what} onChange={(event) => setWhat(event.target.value)} />
              <label htmlFor="why">چرا لازم است</label>
              <textarea id="why" value={why} onChange={(event) => setWhy(event.target.value)} />
              <label htmlFor="price">اثر بر قیمت</label>
              <input id="price" value={price} onChange={(event) => setPrice(event.target.value)} />
              <label htmlFor="time">اثر بر زمان</label>
              <input id="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </>
          ) : null}
          {decision === "offer_alternative" ? (
            <>
              <label htmlFor="alternative">بدیل</label>
              <textarea id="alternative" value={alternative} onChange={(event) => setAlternative(event.target.value)} />
            </>
          ) : null}
          {decision === "decline" ? (
            <>
              <label htmlFor="reason">دلیل رد</label>
              <textarea id="reason" value={reason} onChange={(event) => setReason(event.target.value)} />
            </>
          ) : null}
          <button className="primary-action" type="submit" disabled={!canWrite}>
            ثبت تصمیم و اطلاع به مشتری
          </button>
        </form>
      ) : (
        <p className="commission-note">
          این سفارش از مرحلهٔ بازبینی گذشته است. مشتری وضعیت را در مسیر ساخت می‌بیند. برای ادامه‌ی ساخت از کارگاه هنرمند استفاده کنید.
        </p>
      )}
    </div>
  );
}
