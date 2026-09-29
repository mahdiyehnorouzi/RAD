import type { StoreOrderStatus } from "@rad/types";

export const orderDetailCopy = {
  fa: {
    quantity: "تعداد: {count} عدد",
    viewProgress: "مشاهده وضعیت سفارش",
    addressChange: "نشانی باید عوض شود؟ همین پایین پیام بده",
    reviewTitle: "رسید شما دریافت شد و در انتظار تأیید رَد است.",
    reviewNote: "تا پایان بررسی، اثر برای شما رزرو می‌ماند.",
    receiptTitle: "رسیدی که فرستادی",
  },
  en: {
    quantity: "Quantity: {count}",
    viewProgress: "See order progress",
    addressChange: "Need a different address? Message us below",
    reviewTitle: "Your receipt arrived and is waiting for RAD to confirm it.",
    reviewNote: "The work stays reserved for you until the check ends.",
    receiptTitle: "The receipt you sent",
  },
};

/** Pill tone for the status badge on the summary card. */
export const ORDER_STATUS_TONE: Record<StoreOrderStatus, "wait" | "go" | "stop"> = {
  pending_payment: "wait",
  pending_verification: "wait",
  confirmed: "go",
  packing: "go",
  shipped: "go",
  delivered: "go",
  expired: "stop",
  rejected: "stop",
  cancelled: "stop",
  returned: "stop",
};
