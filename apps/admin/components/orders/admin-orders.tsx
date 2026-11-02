"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Package, Search } from "lucide-react";
import {
  orderStatusLabels,
  orderStatusOptions,
  orderStatusProgress,
  isTerminalOrderStatus,
  type AdminContactMessage,
  type AdminDamageReport,
  type AdminOrder,
  type AdminOrderStatus,
  type AdminProduct,
} from "../../lib/admin-data";
import { coverImage } from "../../lib/product-cover";
import {
  fulfillmentPresentation,
  isDestructiveOrderStatus,
  ORDER_PAGE_SIZE,
  orderQueueFilters,
  paymentPresentation,
  queryOrders,
  trackingCodeHint,
  type OrderDateRange,
  type OrderQueueFilter,
  type OrderSort,
} from "../../lib/order-queue";
import { ConfirmDialog, useIsMobileViewport } from "../admin-dialog";
import { EmptyState, StatusBadge } from "../admin-list-chrome";
import { AdminOrderDamage } from "../admin-order-damage";
import { AdminOrderMessages } from "../admin-order-messages";
import { AdminOrderPayment } from "../admin-order-payment";
import { AdminOrderPolicies } from "../admin-order-policies";
import type { DamageReview } from "../admin-damage-report";

const number = new Intl.NumberFormat("fa-IR");
const money = (value: number) => `${number.format(value)} تومان`;
const dateLabel = (value: number) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(value);
const dateTime = (value: number) =>
  new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);

const actionLabels: Partial<Record<AdminOrderStatus, string>> = {
  confirmed: "بازگشت به تأییدشده",
  packing: "شروع بسته‌بندی",
  shipped: "ثبت ارسال",
  delivered: "ثبت تحویل",
  cancelled: "لغو سفارش",
  returned: "ثبت مرجوعی",
};

const actionOrder: AdminOrderStatus[] = [
  "packing",
  "shipped",
  "delivered",
  "confirmed",
  "cancelled",
  "returned",
];

function stepLabel(status: AdminOrderStatus) {
  switch (status) {
    case "pending_payment":
      return "پرداخت";
    case "pending_verification":
      return "بررسی";
    case "confirmed":
      return "تأیید";
    case "packing":
      return "آماده‌سازی";
    case "shipped":
      return "ارسال";
    case "delivered":
      return "تحویل";
    default:
      return orderStatusLabels[status];
  }
}

export function AdminOrders({
  orders,
  loading,
  loadError,
  onRetry,
  messages,
  onSetMessageStatus,
  onReplyMessage,
  damageReports,
  onReviewDamage,
  canWrite,
  onChange,
  onApprovePayment,
  onRejectPayment,
  products,
  focusOrderId = null,
}: {
  orders: AdminOrder[];
  loading: boolean;
  loadError: boolean;
  onRetry: () => void;
  messages: AdminContactMessage[];
  onSetMessageStatus: (
    id: string,
    status: AdminContactMessage["status"],
  ) => Promise<void>;
  onReplyMessage: (id: string, body: string) => Promise<void>;
  damageReports: AdminDamageReport[];
  onReviewDamage: (id: string, review: DamageReview) => Promise<boolean>;
  canWrite: boolean;
  onChange: (order: AdminOrder) => void | Promise<void>;
  onApprovePayment: (id: string) => Promise<boolean>;
  onRejectPayment: (id: string, reason: string) => Promise<boolean>;
  products: AdminProduct[];
  focusOrderId?: string | null;
}) {
  const list = Array.isArray(orders) ? orders : null;
  const failed = loadError || list === null;
  const mobile = useIsMobileViewport(1100);
  const [filter, setFilter] = useState<OrderQueueFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<OrderSort>("newest");
  const [dateRange, setDateRange] = useState<OrderDateRange>("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusStamp, setFocusStamp] = useState<string | null>(null);
  if (
    focusOrderId &&
    focusOrderId !== focusStamp &&
    list?.some((order) => order.id === focusOrderId)
  ) {
    setFocusStamp(focusOrderId);
    setFilter("all");
    setQuery("");
    setDateRange("all");
    setSort("newest");
    const ordered = list.slice().sort((a, b) => b.createdAt - a.createdAt);
    const index = ordered.findIndex((order) => order.id === focusOrderId);
    setPage(index < 0 ? 1 : Math.floor(index / ORDER_PAGE_SIZE) + 1);
    setSelectedId(focusOrderId);
  }

  const result = useMemo(
    () =>
      queryOrders({
        orders: list ?? [],
        filter,
        query,
        sort,
        dateRange,
        page,
      }),
    [list, filter, query, sort, dateRange, page],
  );

  const activeId = (() => {
    if (selectedId && result.matched.some((order) => order.id === selectedId)) {
      return selectedId;
    }
    if (mobile) return null;
    return result.matched[0]?.id ?? null;
  })();
  const active = (list ?? []).find((order) => order.id === activeId) ?? null;
  const showDetail = Boolean(active) && (!mobile || selectedId === active?.id);

  const covers = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of products) {
      const src = coverImage(product.images)?.src;
      if (src) map.set(product.slug, src);
    }
    return map;
  }, [products]);

  const chooseFilter = (next: OrderQueueFilter) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <section
      className={`paper-panel data-view orders-workspace${showDetail && mobile ? " is-detail" : ""}`}
    >
      <div className="view-heading">
        <div>
          <h2>سفارش‌های فروشگاه</h2>
          <p>
            خرید آثار آماده، از رسید پرداخت تا تحویل. سفارش اختصاصی در بخش
            جداگانه است.
          </p>
        </div>
        {!failed && !loading && list ? (
          <p className="orders-total">
            {number.format(list.length)} سفارش در پایگاه داده
          </p>
        ) : null}
      </div>

      {failed ? (
        <div className="auth-error-state">
          <p>
            دریافت سفارش‌ها ناموفق بود. اتصال را بررسی کنید و دوباره تلاش کنید.
          </p>
          <button className="primary-action" type="button" onClick={onRetry}>
            تلاش دوباره
          </button>
        </div>
      ) : loading || !list ? (
        <p className="admin-loading" role="status">
          در حال بارگذاری سفارش‌ها…
        </p>
      ) : list.length === 0 ? (
        <EmptyState
          title="هنوز سفارشی ثبت نشده"
          description="وقتی مشتری از فروشگاه خرید کند، سفارش اینجا می‌آید."
        />
      ) : (
        <>
          <div
            className="orders-filters"
            role="toolbar"
            aria-label="فیلتر وضعیت سفارش"
          >
            {orderQueueFilters.map((item) => (
              <button
                key={item.id}
                type="button"
                className={filter === item.id ? "is-active" : ""}
                aria-pressed={filter === item.id}
                onClick={() => chooseFilter(item.id)}
              >
                {item.label}
                <span>{number.format(result.counts[item.id])}</span>
              </button>
            ))}
          </div>

          <div className="orders-toolbar">
            <label className="orders-search">
              <Search aria-hidden="true" />
              <span className="sr-only">جست‌وجوی سفارش</span>
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="شماره سفارش، مشتری، اثر یا کد رهگیری"
                type="search"
                enterKeyHint="search"
              />
            </label>
            <label>
              <span className="sr-only">بازه زمان ثبت</span>
              <select
                value={dateRange}
                onChange={(event) => {
                  setDateRange(event.target.value as OrderDateRange);
                  setPage(1);
                }}
              >
                <option value="all">همه زمان‌ها</option>
                <option value="7d">۷ روز اخیر</option>
                <option value="30d">۳۰ روز اخیر</option>
                <option value="90d">۹۰ روز اخیر</option>
              </select>
            </label>
            <label>
              <span className="sr-only">مرتب‌سازی</span>
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as OrderSort);
                  setPage(1);
                }}
              >
                <option value="newest">جدیدترین</option>
                <option value="oldest">قدیمی‌ترین</option>
                <option value="amount_desc">بیشترین مبلغ</option>
                <option value="amount_asc">کمترین مبلغ</option>
              </select>
            </label>
          </div>

          {result.total === 0 ? (
            <EmptyState
              title="سفارشی با این شرط پیدا نشد"
              description="عبارت جست‌وجو، وضعیت یا بازه زمان را تغییر دهید. سفارش‌های دیگر هنوز در پایگاه هستند."
            />
          ) : (
            <div className="orders-layout">
              <div className="orders-queue">
                <p className="orders-range" aria-live="polite">
                  {number.format(result.start)} تا {number.format(result.end)}{" "}
                  از {number.format(result.total)}
                </p>
                <ul className="orders-list">
                  {result.items.map((order) => {
                    const payment = paymentPresentation(order);
                    const fulfillment = fulfillmentPresentation(order);
                    const selected = order.id === active?.id;
                    const review =
                      order.status === "pending_verification" ||
                      order.paymentStatus === "verify_error" ||
                      order.paymentStatus === "verify_conflict";
                    return (
                      <li key={order.id}>
                        <button
                          id={`order-${order.id}`}
                          type="button"
                          className={`orders-row${selected ? " is-active" : ""}${review ? " is-review" : ""}`}
                          aria-current={selected ? "true" : undefined}
                          onClick={() => setSelectedId(order.id)}
                        >
                          <span className="orders-row-top">
                            <StatusBadge
                              label={payment.label}
                              tone={payment.tone}
                            />
                            <StatusBadge
                              label={fulfillment.label}
                              tone={fulfillment.tone}
                            />
                            <time
                              dateTime={new Date(order.createdAt).toISOString()}
                            >
                              {dateLabel(order.createdAt)}
                            </time>
                          </span>
                          <strong>{order.customer}</strong>
                          <span className="orders-row-product">
                            {order.productName || "اثر بدون نام"}
                          </span>
                          <span className="orders-row-foot">
                            <b>{money(order.amount)}</b>
                            <small dir="ltr">{order.id}</small>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {result.pages > 1 ? (
                  <nav className="orders-pager" aria-label="صفحه‌های سفارش">
                    <button
                      type="button"
                      disabled={result.page <= 1}
                      onClick={() => setPage(result.page - 1)}
                    >
                      قبلی
                    </button>
                    <span>
                      {number.format(result.page)} از{" "}
                      {number.format(result.pages)}
                    </span>
                    <button
                      type="button"
                      disabled={result.page >= result.pages}
                      onClick={() => setPage(result.page + 1)}
                    >
                      بعدی
                    </button>
                  </nav>
                ) : null}
              </div>

              {showDetail && active ? (
                <OrderDetail
                  key={`${active.id}:${active.status}:${active.trackingCode ?? ""}`}
                  order={active}
                  covers={covers}
                  mobile={mobile}
                  canWrite={canWrite}
                  messages={messages.filter(
                    (message) => message.orderId === active.id,
                  )}
                  damageReports={damageReports.filter(
                    (report) => report.orderId === active.id,
                  )}
                  onBack={() => setSelectedId(null)}
                  onChange={onChange}
                  onApprovePayment={onApprovePayment}
                  onRejectPayment={onRejectPayment}
                  onSetMessageStatus={onSetMessageStatus}
                  onReplyMessage={onReplyMessage}
                  onReviewDamage={onReviewDamage}
                />
              ) : null}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function OrderDetail({
  order,
  covers,
  mobile,
  canWrite,
  messages,
  damageReports,
  onBack,
  onChange,
  onApprovePayment,
  onRejectPayment,
  onSetMessageStatus,
  onReplyMessage,
  onReviewDamage,
}: {
  order: AdminOrder;
  covers: Map<string, string>;
  mobile: boolean;
  canWrite: boolean;
  messages: AdminContactMessage[];
  damageReports: AdminDamageReport[];
  onBack: () => void;
  onChange: (order: AdminOrder) => void | Promise<void>;
  onApprovePayment: (id: string) => Promise<boolean>;
  onRejectPayment: (id: string, reason: string) => Promise<boolean>;
  onSetMessageStatus: (
    id: string,
    status: AdminContactMessage["status"],
  ) => Promise<void>;
  onReplyMessage: (id: string, body: string) => Promise<void>;
  onReviewDamage: (id: string, review: DamageReview) => Promise<boolean>;
}) {
  const payment = paymentPresentation(order);
  const fulfillment = fulfillmentPresentation(order);
  const terminal = isTerminalOrderStatus(order.status);
  const progressIndex = orderStatusProgress.indexOf(
    order.status as (typeof orderStatusProgress)[number],
  );
  const transitions = orderStatusOptions(order.status)
    .filter((status) => status !== order.status)
    .slice()
    .sort((a, b) => actionOrder.indexOf(a) - actionOrder.indexOf(b));
  const [tracking, setTracking] = useState(order.trackingCode ?? "");
  const [pending, setPending] = useState<AdminOrderStatus | "tracking" | null>(
    null,
  );
  const [confirming, setConfirming] = useState<AdminOrderStatus | null>(null);

  const run = async (next: AdminOrder, key: AdminOrderStatus | "tracking") => {
    setPending(key);
    try {
      await onChange(next);
    } finally {
      setPending(null);
      setConfirming(null);
    }
  };

  const trackingDirty = tracking.trim() !== (order.trackingCode ?? "");
  const trackingIssue = trackingCodeHint(tracking);
  const showTracking =
    Boolean(order.trackingCode) ||
    order.status === "confirmed" ||
    order.status === "packing" ||
    order.status === "shipped" ||
    order.status === "delivered" ||
    transitions.includes("shipped");

  return (
    <article
      className="orders-detail"
      aria-labelledby={`order-title-${order.id}`}
    >
      {mobile ? (
        <button
          className="orders-back text-action"
          type="button"
          onClick={onBack}
        >
          <ChevronRight aria-hidden="true" />
          بازگشت به فهرست
        </button>
      ) : null}
      <header className="orders-detail-head">
        <div>
          <h3 id={`order-title-${order.id}`}>
            سفارش <span dir="ltr">{order.id}</span>
          </h3>
          <p>ثبت شده در {dateTime(order.createdAt)}</p>
        </div>
        <div className="orders-detail-badges">
          <StatusBadge label={payment.label} tone={payment.tone} />
          <StatusBadge label={fulfillment.label} tone={fulfillment.tone} />
        </div>
      </header>

      {terminal || progressIndex < 0 ? (
        <p className="orders-terminal">
          این سفارش در وضعیت «{orderStatusLabels[order.status]}» است و در مسیر
          عادی آماده‌سازی تا تحویل ادامه ندارد.
        </p>
      ) : (
        <ol className="orders-steps" aria-label="مسیر سفارش">
          {orderStatusProgress.map((status, index) => {
            const state =
              index < progressIndex
                ? "is-done"
                : index === progressIndex
                  ? "is-current"
                  : "";
            return (
              <li
                key={status}
                className={state}
                aria-current={index === progressIndex ? "step" : undefined}
              >
                {stepLabel(status)}
              </li>
            );
          })}
        </ol>
      )}

      <div className="orders-sheets">
        <section aria-labelledby={`customer-${order.id}`}>
          <h4 id={`customer-${order.id}`}>مشتری</h4>
          <dl>
            <div>
              <dt>نام</dt>
              <dd>{order.customer}</dd>
            </div>
            <div>
              <dt>تلفن</dt>
              <dd dir="ltr">
                {order.phone ? (
                  <a href={`tel:${order.phone}`}>{order.phone}</a>
                ) : (
                  "ثبت نشده"
                )}
              </dd>
            </div>
          </dl>
        </section>
        <section aria-labelledby={`address-${order.id}`}>
          <h4 id={`address-${order.id}`}>نشانی تحویل</h4>
          <dl>
            <div>
              <dt>شهر</dt>
              <dd>{order.city || "ثبت نشده"}</dd>
            </div>
            <div>
              <dt>نشانی</dt>
              <dd>{order.address || "ثبت نشده"}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="orders-works" aria-labelledby={`works-${order.id}`}>
        <h4 id={`works-${order.id}`}>آثار این سفارش</h4>
        <ul>
          {order.products.map((product, index) => {
            const src = covers.get(product.slug);
            return (
              <li key={`${product.slug}-${index}`}>
                {src ? (
                  <img src={src} alt="" />
                ) : (
                  <span className="orders-work-fallback" aria-hidden="true">
                    <Package />
                  </span>
                )}
                <span>
                  <strong>{product.name}</strong>
                  <small>
                    {product.radNumber != null
                      ? `RAD/${String(product.radNumber).padStart(3, "0")}`
                      : product.slug}
                  </small>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="orders-amount">
          مبلغ سفارش
          <strong>{money(order.amount)}</strong>
        </p>
        {order.paymentAmount != null && order.paymentAmount !== order.amount ? (
          <p className="orders-amount">
            مبلغ ثبت‌شده در پرداخت
            <strong>{money(order.paymentAmount)}</strong>
          </p>
        ) : null}
      </section>

      <AdminOrderPayment
        order={order}
        canWrite={canWrite}
        onApprove={onApprovePayment}
        onReject={onRejectPayment}
      />

      <section className="orders-ship" aria-labelledby={`ship-${order.id}`}>
        <h4 id={`ship-${order.id}`}>ارسال</h4>
        {showTracking ? (
          <label>
            کد رهگیری پست
            <input
              dir="ltr"
              value={tracking}
              disabled={!canWrite || pending !== null}
              onChange={(event) => setTracking(event.target.value)}
              maxLength={40}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={trackingIssue ? true : undefined}
              aria-describedby={
                trackingIssue ? `tracking-issue-${order.id}` : undefined
              }
            />
          </label>
        ) : (
          <p>هنوز به مرحله ارسال نرسیده است.</p>
        )}
        {trackingIssue ? (
          <p className="orders-ship-error" id={`tracking-issue-${order.id}`}>
            {trackingIssue}
          </p>
        ) : null}
        {transitions.includes("shipped") && !tracking.trim() ? (
          <p>
            اگر کد رهگیری را خالی بگذارید، هنگام ثبت ارسال یک کد موقت ساخته
            می‌شود.
          </p>
        ) : null}
        {order.deliveredAt ? (
          <p>تحویل در {dateTime(order.deliveredAt)} ثبت شده است.</p>
        ) : null}
        {canWrite && showTracking && trackingDirty ? (
          <button
            className="secondary-action"
            type="button"
            disabled={
              pending !== null ||
              tracking.trim().length === 0 ||
              Boolean(trackingIssue)
            }
            onClick={() =>
              void run({ ...order, trackingCode: tracking.trim() }, "tracking")
            }
          >
            {pending === "tracking" ? "در حال ثبت…" : "ثبت کد رهگیری"}
          </button>
        ) : null}
      </section>

      <section
        className="orders-actions"
        aria-labelledby={`actions-${order.id}`}
      >
        <h4 id={`actions-${order.id}`}>اقدام</h4>
        {!canWrite ? (
          <p>نقش شما اجازه تغییر وضعیت این سفارش را نمی‌دهد.</p>
        ) : transitions.length === 0 ? (
          <p>تغییر وضعیت دیگری برای این سفارش تعریف نشده است.</p>
        ) : (
          <div className="orders-action-row">
            {transitions.map((status) => {
              const destructive = isDestructiveOrderStatus(status);
              const blockedByTracking =
                status === "shipped" && Boolean(trackingIssue);
              return (
                <button
                  key={status}
                  type="button"
                  className={destructive ? "danger-action" : "primary-action"}
                  disabled={pending !== null || blockedByTracking}
                  onClick={() => {
                    const next = {
                      ...order,
                      status,
                      trackingCode:
                        status === "shipped"
                          ? tracking.trim() || order.trackingCode
                          : order.trackingCode,
                    };
                    if (destructive) {
                      setConfirming(status);
                      return;
                    }
                    void run(next, status);
                  }}
                >
                  {pending === status
                    ? "در حال ثبت…"
                    : (actionLabels[status] ?? orderStatusLabels[status])}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <AdminOrderMessages
        messages={messages}
        canWrite={canWrite}
        onSetStatus={onSetMessageStatus}
        onReply={onReplyMessage}
      />
      <AdminOrderDamage
        reports={damageReports}
        canWrite={canWrite}
        onReview={onReviewDamage}
      />
      <AdminOrderPolicies order={order} />

      {confirming ? (
        <ConfirmDialog
          title={confirming === "cancelled" ? "لغو این سفارش؟" : "ثبت مرجوعی؟"}
          description={
            confirming === "cancelled"
              ? "سفارش لغو می‌شود و اثر دوباره در فروشگاه قرار می‌گیرد."
              : "سفارش مرجوع می‌شود و اثر دوباره در فروشگاه قرار می‌گیرد."
          }
          confirmLabel={confirming === "cancelled" ? "لغو سفارش" : "ثبت مرجوعی"}
          onCancel={() => setConfirming(null)}
          onConfirm={() =>
            run(
              {
                ...order,
                status: confirming,
                trackingCode: order.trackingCode,
              },
              confirming,
            )
          }
        />
      ) : null}
    </article>
  );
}
