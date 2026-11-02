import {
  orderStatusLabels,
  type AdminOrder,
  type AdminOrderStatus,
  type AdminPaymentStatus,
} from "./admin-data";

/**
 * Client-side queue over `GET /admin/orders`. The endpoint returns every
 * shop order, newest first, with no query parameters — filtering here does
 * not drop rows the API never sent.
 */
export const ORDER_PAGE_SIZE = 8;

export const orderQueueFilters = [
  { id: "all", label: "همه" },
  { id: "pending_verification", label: "در انتظار تأیید" },
  { id: "confirmed", label: "تأیید شده" },
  { id: "packing", label: "بسته‌بندی" },
  { id: "shipped", label: "ارسال شده" },
  { id: "delivered", label: "تحویل شده" },
  { id: "needs_attention", label: "نیاز به پیگیری" },
] as const;

export type OrderQueueFilter = (typeof orderQueueFilters)[number]["id"];

export type OrderSort = "newest" | "oldest" | "amount_desc" | "amount_asc";

export type OrderDateRange = "all" | "7d" | "30d" | "90d";

export type BadgeTone = "green" | "oxide" | "sand" | "muted";

const DAY_MS = 24 * 60 * 60 * 1000;

const dateWindows: Record<Exclude<OrderDateRange, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

/**
 * A 2xx body that is not an array must not be stored as the order list.
 * An object has no `length`, and the screen used to render that as
 * "no orders" after a decode or proxy failure.
 */
export function assertOrderList(data: unknown): AdminOrder[] {
  if (!Array.isArray(data)) {
    throw new Error("پاسخ فهرست سفارش‌ها نامعتبر است.");
  }
  return data as AdminOrder[];
}

export function foldSearchText(value: string) {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return value
    .toLowerCase()
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/\s+/g, " ")
    .trim();
}

function orderHaystack(order: AdminOrder) {
  const rads = order.products.flatMap((product) => {
    if (product.radNumber == null) return [product.slug, product.name];
    const padded = String(product.radNumber).padStart(3, "0");
    return [
      product.slug,
      product.name,
      String(product.radNumber),
      padded,
      `rad/${padded}`,
    ];
  });
  return foldSearchText(
    [
      order.id,
      order.customer,
      order.phone ?? "",
      order.city ?? "",
      order.address ?? "",
      order.productName,
      order.trackingCode ?? "",
      order.paymentTrackingNumber ?? "",
      order.paymentGatewayRefId ?? "",
      ...rads,
    ].join(" "),
  );
}

export function orderMatchesQuery(order: AdminOrder, query: string) {
  const needle = foldSearchText(query);
  if (!needle) return true;
  const haystack = orderHaystack(order);
  return needle.split(" ").every((token) => haystack.includes(token));
}

export function orderNeedsAttention(order: AdminOrder) {
  if (
    order.paymentStatus === "verify_error" ||
    order.paymentStatus === "verify_conflict"
  ) {
    return true;
  }
  return (
    order.status === "pending_payment" ||
    order.status === "expired" ||
    order.status === "rejected" ||
    order.status === "cancelled" ||
    order.status === "returned"
  );
}

export function orderMatchesFilter(
  order: AdminOrder,
  filter: OrderQueueFilter,
) {
  if (filter === "all") return true;
  if (filter === "needs_attention") return orderNeedsAttention(order);
  return order.status === filter;
}

export function orderMatchesDate(
  order: AdminOrder,
  range: OrderDateRange,
  now = Date.now(),
) {
  if (range === "all") return true;
  return order.createdAt >= now - dateWindows[range] * DAY_MS;
}

export function compareOrders(sort: OrderSort) {
  return (a: AdminOrder, b: AdminOrder) => {
    if (sort === "oldest") return a.createdAt - b.createdAt;
    if (sort === "amount_desc")
      return b.amount - a.amount || b.createdAt - a.createdAt;
    if (sort === "amount_asc")
      return a.amount - b.amount || b.createdAt - a.createdAt;
    return b.createdAt - a.createdAt;
  };
}

export function paymentPresentation(order: AdminOrder): {
  label: string;
  tone: BadgeTone;
} {
  const status = order.paymentStatus;
  const labels: Record<AdminPaymentStatus, { label: string; tone: BadgeTone }> =
    {
      verified: { label: "پرداخت تأیید شد", tone: "green" },
      submitted: { label: "رسید ثبت شد", tone: "sand" },
      rejected: { label: "پرداخت رد شد", tone: "oxide" },
      failed: { label: "پرداخت ناموفق", tone: "oxide" },
      verify_error: { label: "تأیید درگاه نامشخص", tone: "oxide" },
      verify_conflict: { label: "تعارض رزرو", tone: "oxide" },
      redirected: { label: "در بازگشت از درگاه", tone: "sand" },
      created: { label: "در انتظار پرداخت", tone: "muted" },
    };
  if (status && labels[status]) return labels[status];
  if (order.status === "pending_payment") {
    return { label: "در انتظار پرداخت", tone: "muted" };
  }
  return { label: "وضعیت پرداخت نامشخص", tone: "muted" };
}

export function fulfillmentPresentation(order: AdminOrder): {
  label: string;
  tone: BadgeTone;
} {
  const tone: BadgeTone =
    order.status === "delivered" ||
    order.status === "confirmed" ||
    order.status === "shipped"
      ? "green"
      : order.status === "packing" || order.status === "pending_verification"
        ? "sand"
        : order.status === "pending_payment"
          ? "muted"
          : "oxide";
  return { label: orderStatusLabels[order.status], tone };
}

export function queryOrders({
  orders,
  filter,
  query,
  sort,
  dateRange,
  page,
  pageSize = ORDER_PAGE_SIZE,
  now = Date.now(),
}: {
  orders: AdminOrder[];
  filter: OrderQueueFilter;
  query: string;
  sort: OrderSort;
  dateRange: OrderDateRange;
  page: number;
  pageSize?: number;
  now?: number;
}) {
  const inWindow = orders.filter(
    (order) =>
      orderMatchesQuery(order, query) &&
      orderMatchesDate(order, dateRange, now),
  );
  const counts = Object.fromEntries(
    orderQueueFilters.map((item) => [
      item.id,
      inWindow.filter((order) => orderMatchesFilter(order, item.id)).length,
    ]),
  ) as Record<OrderQueueFilter, number>;
  const matched = inWindow
    .filter((order) => orderMatchesFilter(order, filter))
    .slice()
    .sort(compareOrders(sort));
  const pages = Math.max(1, Math.ceil(matched.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pages);
  const start = (safePage - 1) * pageSize;
  return {
    counts,
    matched,
    items: matched.slice(start, start + pageSize),
    total: matched.length,
    page: safePage,
    pages,
    start: matched.length ? start + 1 : 0,
    end: Math.min(start + pageSize, matched.length),
  };
}

export function isDestructiveOrderStatus(status: AdminOrderStatus) {
  return status === "cancelled" || status === "returned";
}
