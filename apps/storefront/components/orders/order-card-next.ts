import type { StoreOrderStatus } from "@rad/types";

const NEXT: Record<StoreOrderStatus, { fa: string; en: string }> = {
  pending_payment: {
    fa: "برای نگه داشتن اثر، پرداخت را تمام کنید.",
    en: "Finish payment to keep the work.",
  },
  pending_verification: {
    fa: "رسید شما رسیده و پرداخت در حال بررسی است.",
    en: "Your receipt is in and the payment is being checked.",
  },
  confirmed: {
    fa: "پرداخت تأیید شد. اثر برای بسته‌بندی آماده می‌شود.",
    en: "Payment is confirmed. The work is being prepared to pack.",
  },
  packing: {
    fa: "اثر در حال بسته‌بندی است.",
    en: "The work is being packed.",
  },
  shipped: {
    fa: "بسته به پست سپرده شده است.",
    en: "The parcel has been handed to the post.",
  },
  delivered: {
    fa: "این اثر به دست شما رسیده است.",
    en: "This work has reached you.",
  },
  expired: {
    fa: "مهلت پرداخت تمام شد.",
    en: "The payment window has closed.",
  },
  rejected: {
    fa: "این پرداخت پذیرفته نشد.",
    en: "This payment was not accepted.",
  },
  cancelled: {
    fa: "این سفارش لغو شده است.",
    en: "This order is cancelled.",
  },
  returned: {
    fa: "این سفارش مرجوع شده است.",
    en: "This order was returned.",
  },
};

export function orderCardNext(status: StoreOrderStatus, locale: "fa" | "en") {
  return NEXT[status][locale];
}
