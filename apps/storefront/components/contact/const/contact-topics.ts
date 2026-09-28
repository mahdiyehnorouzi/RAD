import type { ContactTopic } from "@rad/types";
import type { LocaleCopy } from "@/types/locale";

export const CONTACT_TOPIC_LABELS: Record<ContactTopic, LocaleCopy> = {
  custom: { fa: "سفارش اختصاصی", en: "A custom piece" },
  order: { fa: "پیگیری سفارش", en: "Tracking an order" },
  payment: { fa: "پرداخت و فیش", en: "Payment and receipt" },
  collaboration: { fa: "همکاری", en: "Working together" },
  other: { fa: "موضوع دیگه", en: "Something else" },
};

/** Topics where an order number helps RAD find the right record. */
export const ORDER_TOPICS: readonly ContactTopic[] = ["order", "payment"];
