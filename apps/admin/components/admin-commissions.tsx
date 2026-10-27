"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Boxes,
  Calendar,
  ChevronRight,
  CircleDollarSign,
  ImageIcon,
  Mic,
  Package,
  Ruler,
  Search,
  ShieldCheck,
  Tag,
  X,
} from "lucide-react";
import {
  commissionStageLabels,
  commissionStageOrder,
  resolveCommissionSelection,
  stageCountLabel,
  type AdminCommission,
  type AdminCommissionStage,
} from "../lib/admin-data";
import { StageMeter } from "@rad/ui";
import { useBodyScrollLock, useIsMobileViewport } from "./admin-dialog";

// Deep-links a selected commission as a URL hash (#commissions/RAD-M-...)
// scoped to this section only — the rest of the admin shell has no router
// integration, so this stays a local, self-contained affordance rather
// than a shell-wide routing change. It gives refresh and direct links a
// selection to restore, and the browser back button a step to land on
// (list -> detail -> back) without a full history stack per click.
const HASH_PREFIX = "#commissions/";
function readHashCommissionId(): string | null {
  if (typeof window === "undefined") return null;
  const { hash } = window.location;
  return hash.startsWith(HASH_PREFIX)
    ? decodeURIComponent(hash.slice(HASH_PREFIX.length))
    : null;
}

const copy = (value: { fa: string; en: string }) => value.fa;
const date = (value: number) =>
  new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
const shortDate = (value: number) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(value);

// The commission entity stores almost everything inside a jsonb `payload`
// blob (see apps/api/src/commissions/commission.types.ts — `MakingBrief` /
// `MakingCommission`). AdminCommission only types a flat subset; this reads
// the rest of the real, already-delivered payload defensively rather than
// inventing fields that don't exist.
interface CommissionBriefPayload {
  voice?: string;
  dimensions?: string;
  budget?: string;
  permission?: string;
  category?: string;
  image?: string;
  images?: string[];
}
interface CommissionPayloadShape {
  brief?: CommissionBriefPayload;
  deadlineAt?: number;
  estimatedCompletion?: string;
}
function readPayload(payload: unknown): CommissionPayloadShape {
  if (payload && typeof payload === "object")
    return payload as CommissionPayloadShape;
  return {};
}

function statusTone(commission: AdminCommission): "oxide" | "green" | "muted" {
  if (commission.stage === "declined") return "muted";
  if (commission.nextActor === "artist") return "oxide";
  if (commission.stage === "complete") return "green";
  return "muted";
}

export function AdminCommissions({
  commissions,
  canWrite,
  onDecide,
  onMessage,
  onBeginReview,
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
  onMessage: (
    id: string,
    body: { fa: string; en: string },
    internal?: boolean,
  ) => Promise<unknown>;
  onBeginReview: (id: string) => Promise<unknown>;
}) {
  // Opening Custom Orders always shows the list first; a selection only
  // comes from the admin tapping a card, or from a hash deep-link/refresh
  // (read synchronously at mount, below). Never auto-select "the first"
  // or "the last" order. `requestedId` is the raw intent (what was
  // clicked, or what the hash said); `selectedId` is derived from it
  // against the real list so a stale/removed id never resolves to some
  // other order.
  const [requestedId, setRequestedId] = useState<string | null>(() =>
    readHashCommissionId(),
  );
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<AdminCommissionStage | "all">(
    "all",
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobileViewport();

  useEffect(() => {
    const onPopState = () => setRequestedId(readHashCommissionId());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const selectedId = useMemo(
    () => resolveCommissionSelection(commissions, requestedId),
    [commissions, requestedId],
  );
  const selected = commissions.find((item) => item.id === selectedId) ?? null;

  const filtered = useMemo(
    () =>
      commissions
        .filter((item) => stageFilter === "all" || item.stage === stageFilter)
        .filter((item) =>
          `${item.customerName} ${item.concept} ${item.id}`.includes(
            query.trim(),
          ),
        ),
    [commissions, query, stageFilter],
  );

  const selectCommission = (id: string) => {
    setRequestedId(id);
    window.history.pushState(null, "", `${HASH_PREFIX}${encodeURIComponent(id)}`);
    const item = commissions.find((entry) => entry.id === id);
    if (canWrite && item?.stage === "design_submitted") {
      void onBeginReview(id);
    }
  };

  const closeDetail = () => {
    setRequestedId(null);
    // Drop back to a plain hash-less URL rather than pushing another
    // history entry, so repeated open/close doesn't pile up back-stops.
    window.history.pushState(null, "", window.location.pathname + window.location.search);
  };

  const stagesWithData = useMemo(
    () =>
      [...commissionStageOrder, "declined" as const].filter((stage) =>
        commissions.some((item) => item.stage === stage),
      ),
    [commissions],
  );

  return (
    <section
      className={`paper-panel data-view commission-view${selected ? " has-detail" : ""}`}
    >
      <div className="view-heading">
        <div>
          <span className="eyebrow">دفتر کوره</span>
          <h2>سفارش اختصاصی</h2>
          <p>
            سفارش اختصاصی خرید اثر آماده نیست؛ یک قطعه‌ی یک‌به‌یک است که پس از
            تأیید شما ساخته می‌شود. پیام‌ها و تصمیم بازبینی همین‌جا ثبت می‌شوند
            و مشتری در مسیر ساخت و اعلان‌ها می‌بیند.
          </p>
        </div>
      </div>
      <div className="toolbar">
        <div className="search-field">
          <Search />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جست‌وجو در نام سفارش، مشتری یا کد سفارش"
            aria-label="جست‌وجوی سفارش اختصاصی"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="پاک کردن جست‌وجو"
            >
              <X />
            </button>
          )}
        </div>
      </div>
      <div className="commission-filters">
        <button
          type="button"
          className={stageFilter === "all" ? "active" : ""}
          onClick={() => setStageFilter("all")}
        >
          همه
        </button>
        {stagesWithData.map((stage) => (
          <button
            key={stage}
            type="button"
            className={stageFilter === stage ? "active" : ""}
            onClick={() => setStageFilter(stage)}
          >
            {commissionStageLabels[stage]}
          </button>
        ))}
      </div>
      <div className="commission-layout">
        <div className="commission-list">
          {filtered.length ? (
            filtered.map((item) => {
              const meter = commissionMeter(item);
              const payload = readPayload(item.payload);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`commission-card${item.id === selectedId ? " active" : ""}`}
                  onClick={() => selectCommission(item.id)}
                >
                  <header>
                    <span className={`status-badge ${statusTone(item)}`}>
                      {item.nextActor === "artist" && item.stage !== "declined"
                        ? "نیاز به بررسی"
                        : commissionStageLabels[item.stage]}
                    </span>
                    <small>{shortDate(item.createdAt)}</small>
                  </header>
                  <strong>{item.customerName}</strong>
                  <span className="commission-card-id">{item.id}</span>
                  <p>{item.concept}</p>
                  {payload.brief?.budget && (
                    <span className="commission-card-budget">
                      <CircleDollarSign /> {payload.brief.budget}
                    </span>
                  )}
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
            <p className="commission-empty">
              {commissions.length
                ? "سفارشی با این جست‌وجو پیدا نشد."
                : "هنوز سفارش اختصاصی‌ای ارسال نشده است."}
            </p>
          )}
        </div>
        {selected ? (
          <CommissionDetail
            commission={selected}
            canWrite={canWrite}
            onDecide={onDecide}
            onMessage={onMessage}
            onClose={closeDetail}
          />
        ) : !isMobile ? (
          // On mobile the list is the whole screen when nothing is
          // selected — an empty placeholder panel would just be dead
          // space under it, so it only renders on desktop's two-column
          // layout, where it fills the second column.
          <div className="commission-empty-detail">
            یک سفارش را از فهرست انتخاب کنید.
          </div>
        ) : null}
      </div>
    </section>
  );
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

function asCopy(value: string) {
  return { fa: value, en: value };
}

type DetailTab = "summary" | "files" | "messages" | "decision";

function CommissionDetail({
  commission,
  canWrite,
  onDecide,
  onMessage,
  onClose,
}: {
  commission: AdminCommission;
  canWrite: boolean;
  onDecide: Parameters<typeof AdminCommissions>[0]["onDecide"];
  onMessage: Parameters<typeof AdminCommissions>[0]["onMessage"];
  onClose: () => void;
}) {
  // Below the mobile breakpoint, `.commission-detail` becomes a position:
  // fixed full-screen overlay (see the `.commission-view.has-detail` rule
  // in globals.css) — only lock background scroll then; on desktop this
  // is just an inline panel beside the list and must not block the page.
  const isMobile = useIsMobileViewport();
  useBodyScrollLock(isMobile);
  const open =
    commission.stage === "design_submitted" ||
    (commission.stage === "feasibility" && commission.nextActor === "artist");
  const [tab, setTab] = useState<DetailTab>(open ? "decision" : "summary");
  const meter = commissionMeter(commission);
  const payload = readPayload(commission.payload);
  const brief = payload.brief;
  const images = brief?.images?.length
    ? brief.images
    : brief?.image || commission.image
      ? [brief?.image ?? commission.image!]
      : [];

  const tabs: { id: DetailTab; label: string }[] = [
    { id: "summary", label: "خلاصه" },
    { id: "files", label: "فایل‌ها" },
    { id: "messages", label: "پیام‌ها" },
    ...(open ? [{ id: "decision" as const, label: "تصمیم" }] : []),
  ];

  return (
    <div className="commission-detail">
      <button
        className="commission-detail-close"
        type="button"
        onClick={onClose}
        aria-label="بازگشت به فهرست"
      >
        <ChevronRight />
        بازگشت به فهرست
      </button>
      <header>
        <span className="eyebrow">{commission.id}</span>
        <h3>{commission.customerName}</h3>
        <p>
          {commission.concept} · {commission.material || "ماده ثبت نشده"}
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
      <div className="commission-tabs" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? "active" : ""}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "summary" && (
        <div className="commission-summary">
          <dl className="commission-facts">
            <div>
              <dt>
                <Package /> هنرمند
              </dt>
              <dd>{commission.artistName || "تعیین‌نشده"}</dd>
            </div>
            <div>
              <dt>
                <Tag /> دسته‌بندی
              </dt>
              <dd>{brief?.category || "ثبت نشده"}</dd>
            </div>
            <div>
              <dt>
                <Ruler /> اندازه
              </dt>
              <dd>{brief?.dimensions || "ثبت نشده"}</dd>
            </div>
            <div>
              <dt>
                <CircleDollarSign /> بودجه
              </dt>
              <dd>{brief?.budget || "ثبت نشده"}</dd>
            </div>
            <div>
              <dt>
                <Boxes /> کاربرد و استایل
              </dt>
              <dd>{commission.intendedUse || "ثبت نشده"}</dd>
            </div>
            <div>
              <dt>
                <ShieldCheck /> اجازه بازآفرینی
              </dt>
              <dd>{brief?.permission || "ثبت نشده"}</dd>
            </div>
            {payload.estimatedCompletion && (
              <div>
                <dt>
                  <Calendar /> زمان تحویل موردنظر
                </dt>
                <dd>{payload.estimatedCompletion}</dd>
              </div>
            )}
            {payload.deadlineAt && (
              <div>
                <dt>
                  <Calendar /> مهلت پاسخ
                </dt>
                <dd>{shortDate(payload.deadlineAt)}</dd>
              </div>
            )}
          </dl>
          {brief?.voice && (
            <div className="commission-voice">
              <Mic />
              <audio controls src={brief.voice} />
            </div>
          )}
        </div>
      )}

      {tab === "files" &&
        (images.length ? (
          <div className="commission-files">
            {images.map((src, index) => (
              <a
                key={`${src}-${index}`}
                href={src}
                target="_blank"
                rel="noreferrer"
                className="commission-file"
              >
                <img src={src} alt="" />
              </a>
            ))}
          </div>
        ) : (
          <p className="commission-empty-detail inline">
            <ImageIcon /> فایل مرجعی برای این سفارش ثبت نشده است.
          </p>
        ))}

      {tab === "messages" && (
        <CommissionMessages
          commission={commission}
          canWrite={canWrite}
          onMessage={onMessage}
        />
      )}

      {tab === "decision" && open && (
        <CommissionDecisionForm
          commission={commission}
          canWrite={canWrite}
          onDecide={onDecide}
        />
      )}
      {tab === "decision" && !open && (
        <p className="commission-note">
          این سفارش از مرحلهٔ بازبینی گذشته است. مشتری وضعیت را در مسیر ساخت
          می‌بیند. برای ادامه‌ی ساخت وارد{" "}
          <a
            href="https://rad-object.com/workshop"
            target="_blank"
            rel="noreferrer"
          >
            کارگاه هنرمند
          </a>{" "}
          شوید.
        </p>
      )}
    </div>
  );
}

function CommissionMessages({
  commission,
  canWrite,
  onMessage,
}: {
  commission: AdminCommission;
  canWrite: boolean;
  onMessage: Parameters<typeof AdminCommissions>[0]["onMessage"];
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const send = () => {
    const body = message.trim();
    if (!body || !canWrite || sending) return;
    setSending(true);
    setError("");
    void onMessage(commission.id, asCopy(body))
      .then(() => setMessage(""))
      .catch((err) =>
        setError((err as Error).message || "ارسال پیام ناموفق بود."),
      )
      .finally(() => setSending(false));
  };

  return (
    <div className="commission-messages-pane">
      <ol className="commission-thread">
        {commission.messages.length ? (
          commission.messages.map((item) => (
            <li key={item.id} className={item.author}>
              <b>
                {item.author === "artist" ? "کارگاه" : commission.customerName}
              </b>
              <span>{date(item.createdAt)}</span>
              <p>{copy(item.body)}</p>
            </li>
          ))
        ) : (
          <li>
            <p>
              هنوز پیامی رد و بدل نشده. تصمیم یا پیام شما برای مشتری در مسیر
              ساخت ظاهر می‌شود.
            </p>
          </li>
        )}
      </ol>
      <form
        className="commission-message"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <label htmlFor="studio-message">پیام به مشتری</label>
        <textarea
          id="studio-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          disabled={sending}
        />
        {error && (
          <p className="commission-message-error" role="alert">
            {error}
            <button type="button" onClick={send}>
              تلاش دوباره
            </button>
          </p>
        )}
        <button
          className="secondary-action"
          type="submit"
          disabled={!canWrite || !message.trim() || sending}
        >
          {sending ? "در حال ارسال…" : "ارسال پیام"}
        </button>
      </form>
    </div>
  );
}

function CommissionDecisionForm({
  commission,
  canWrite,
  onDecide,
}: {
  commission: AdminCommission;
  canWrite: boolean;
  onDecide: Parameters<typeof AdminCommissions>[0]["onDecide"];
}) {
  const [decision, setDecision] = useState<
    "approve" | "request_change" | "offer_alternative" | "decline"
  >("approve");
  const [reason, setReason] = useState("");
  const [alternative, setAlternative] = useState("");
  const [what, setWhat] = useState("");
  const [why, setWhy] = useState("");
  const [price, setPrice] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const decisionOptions: {
    value: typeof decision;
    label: string;
    note: string;
  }[] = [
    {
      value: "approve",
      label: "تأیید طرح",
      note: "طرح تأیید شده و می‌توان وارد مرحله بعد شد.",
    },
    {
      value: "request_change",
      label: "نیاز به اصلاح",
      note: "درخواست تغییرات از مشتری و ادامه بررسی.",
    },
    {
      value: "offer_alternative",
      label: "پیشنهاد بدیل",
      note: "امکان‌پذیری بررسی شد و قیمت پیشنهادی ارسال می‌شود.",
    },
    {
      value: "decline",
      label: "رد سفارش",
      note: "امکان اجرای سفارش وجود ندارد.",
    },
  ];

  return (
    <form
      className="commission-decide"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canWrite || submitting) return;
        setSubmitting(true);
        setError("");
        void onDecide({
          id: commission.id,
          decision,
          reason: reason.trim() ? asCopy(reason.trim()) : undefined,
          alternative: alternative.trim()
            ? asCopy(alternative.trim())
            : undefined,
          change:
            decision === "request_change"
              ? {
                  whatChanged: asCopy(
                    what.trim() || "جزئیات ساخت باید عوض شود.",
                  ),
                  whyNecessary: asCopy(
                    why.trim() || "با ماده فعلی قابل ساخت نیست.",
                  ),
                  priceImpact: asCopy(price.trim() || "بدون تغییر قیمت"),
                  timeImpact: asCopy(time.trim() || "بدون تغییر زمان"),
                }
              : undefined,
        })
          .catch((err) =>
            setError((err as Error).message || "ثبت تصمیم ناموفق بود."),
          )
          .finally(() => setSubmitting(false));
      }}
    >
      <div className="commission-decision-grid">
        {decisionOptions.map((option) => (
          <label
            key={option.value}
            className={`commission-decision-card${decision === option.value ? " active" : ""}`}
          >
            <input
              type="radio"
              name="decision"
              value={option.value}
              checked={decision === option.value}
              onChange={() => setDecision(option.value)}
            />
            <strong>{option.label}</strong>
            <span>{option.note}</span>
          </label>
        ))}
      </div>
      {decision === "request_change" ? (
        <>
          <label htmlFor="what">چه چیزی عوض می‌شود</label>
          <textarea
            id="what"
            value={what}
            onChange={(event) => setWhat(event.target.value)}
          />
          <label htmlFor="why">چرا لازم است</label>
          <textarea
            id="why"
            value={why}
            onChange={(event) => setWhy(event.target.value)}
          />
          <label htmlFor="price">اثر بر قیمت</label>
          <input
            id="price"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
          <label htmlFor="time">اثر بر زمان</label>
          <input
            id="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
        </>
      ) : null}
      {decision === "offer_alternative" ? (
        <>
          <label htmlFor="alternative">بدیل</label>
          <textarea
            id="alternative"
            value={alternative}
            onChange={(event) => setAlternative(event.target.value)}
          />
        </>
      ) : null}
      {decision === "decline" ? (
        <>
          <label htmlFor="reason">دلیل رد</label>
          <textarea
            id="reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </>
      ) : null}
      {error && (
        <p className="commission-message-error" role="alert">
          {error}
        </p>
      )}
      <button
        className="primary-action"
        type="submit"
        disabled={!canWrite || submitting}
      >
        {submitting ? "در حال ثبت…" : "ثبت تصمیم و اطلاع به مشتری"}
      </button>
    </form>
  );
}
