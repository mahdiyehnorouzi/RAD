import type { PolicySlug, StoreOrderStatus } from "@rad/types";
import type { LocaleCopy } from "@/types/locale";

/**
 * Copy for the rules shown along the purchase path. Hours quoted here
 * come from the current policy texts; publish a new policy version
 * before changing them.
 */
export const purchasePathCopy = {
  fa: {
    disclosureTitle: "ارسال و بازگشت",
    disclosureTeaser:
      "پس از آماده‌شدن اثر، سفارش‌های تهران با پست یا پیک و سفارش‌های شهرهای دیگر با پست ارسال می‌شوند.",
    fullShipping: "متن کامل ارسال",
    fullReturns: "متن کامل مرجوعی و آسیب",
    cartFinal:
      "پس از آماده‌شدن اثر، سفارش‌های تهران با پست یا پیک و سفارش‌های شهرهای دیگر با پست ارسال می‌شوند.",
    cartRules: "شرایط ارسال و بازگشت",
    digestTitle: "پیش از پرداخت بدان",
    agreeTerms: "شرایط خرید",
    agreeShipping: "ارسال",
    agreeReturns: "بازگشت",
    agreePrivacy: "حریم خصوصی",
    agreeSentence:
      "{terms}، {shipping} و {returns} و متن {privacy} رَد را خواندم و می‌پذیرم.",
    agreeNote: "نسخه‌ای که امروز می‌پذیری همراه سفارشت ذخیره می‌شود.",
    agreeRequired: "برای ثبت سفارش، تیک پذیرش شرایط را بزن.",
    newTab: "(در زبانه‌ی تازه)",
    afterReceipt:
      "یک نفر از رَد رسید را با واریزی حساب تطبیق می‌دهد و نتیجه را در صفحه‌ی سفارش و اعلان‌ها می‌بینی.",
    statusGuideTitle: "این مرحله یعنی چه؟",
    statusGuideMore: "قانون مربوط",
    acceptedTitle: "قوانین این سفارش",
    acceptedBody:
      "این سفارش در {date} با این نسخه‌ها ثبت شده و تابع همین متن‌هاست:",
    customRulesLink: "متن کامل شرایط سفارش اختصاصی",
  },
  en: {
    disclosureTitle: "Shipping and returns",
    disclosureTeaser:
      "After the work is ready, Tehran orders are sent by post or courier; orders to other cities are sent by post.",
    fullShipping: "Full shipping text",
    fullReturns: "Full returns and damage text",
    cartFinal:
      "After the work is ready, Tehran orders are sent by post or courier; orders to other cities are sent by post.",
    cartRules: "Shipping and returns terms",
    digestTitle: "Before you pay",
    agreeTerms: "terms of sale",
    agreeShipping: "shipping",
    agreeReturns: "returns",
    agreePrivacy: "privacy",
    agreeSentence:
      "I have read and accept RAD's {terms}, {shipping} and {returns} rules and {privacy} text.",
    agreeNote: "The version you accept today is saved with your order.",
    agreeRequired:
      "Tick the box to accept the terms before placing your order.",
    newTab: "(opens in a new tab)",
    afterReceipt:
      "A person at RAD matches the receipt to the transfer; you see the result on your order page and in notifications.",
    statusGuideTitle: "What this step means",
    statusGuideMore: "The rule behind it",
    acceptedTitle: "Rules for this order",
    acceptedBody:
      "This order was placed on {date} under these versions and is governed by them:",
    customRulesLink: "Full custom-order terms",
  },
} as const;

export type StatusGuide = {
  title: LocaleCopy;
  body: LocaleCopy;
  slug: PolicySlug;
  section: string;
};

/** What each order status means for the buyer, and the rule behind it. */
export const ORDER_STATUS_GUIDE: Record<StoreOrderStatus, StatusGuide> = {
  pending_payment: {
    title: {
      fa: "منتظر واریز و رسید تو",
      en: "Waiting for your transfer and receipt",
    },
    body: {
      fa: "مبلغ دقیق را به کارتی که می‌بینی واریز کن و رسید و شماره‌ی پیگیری را بفرست. تا پیش از فرستادن رسید، لغو سفارش هزینه‌ای ندارد.",
      en: "Transfer the exact amount to the card shown and send the receipt and tracking number. Until you send a receipt, cancelling costs nothing.",
    },
    slug: "buying",
    section: "payment",
  },
  pending_verification: {
    title: { fa: "رسیدت به ما رسید", en: "We have your receipt" },
    body: {
      fa: "یک نفر از رَد رسید را با واریزی حساب تطبیق می‌دهد. تا پایان بررسی اثر برای تو می‌ماند و اگر لازم شد، می‌توانی رسید را عوض کنی.",
      en: "A person at RAD is matching the receipt to the transfer. The work stays yours until the check ends, and you can replace the receipt if needed.",
    },
    slug: "buying",
    section: "confirmation",
  },
  confirmed: {
    title: { fa: "پرداخت تأیید شد", en: "Payment confirmed" },
    body: {
      fa: "پس از آماده‌شدن اثر، سفارش‌های تهران با پست یا پیک و سفارش‌های شهرهای دیگر با پست ارسال می‌شوند.",
      en: "After the work is ready, Tehran orders are sent by post or courier; orders to other cities are sent by post.",
    },
    slug: "shipping",
    section: "method",
  },
  packing: {
    title: { fa: "در حال بسته‌بندی", en: "Being packed" },
    body: {
      fa: "اثر در جعبه‌ی دولایه، با محافظ متناسب با فرمش و شناسنامه‌ی امضاشده بسته می‌شود.",
      en: "The work is going into a double box with protection shaped to its form and a signed certificate.",
    },
    slug: "shipping",
    section: "packaging",
  },
  shipped: {
    title: { fa: "در راه", en: "On its way" },
    body: {
      fa: "کد رهگیری بالای همین صفحه است. هنگام تحویل، اگر جعبه آسیب دیده بود، پیش از باز کردن از آن عکس بگیر.",
      en: "The tracking code is above. When it arrives, if the box looks damaged, photograph it before opening.",
    },
    slug: "shipping",
    section: "receiving",
  },
  delivered: {
    title: { fa: "به دستت رسید", en: "Delivered" },
    body: {
      fa: "اگر اثر آسیب دیده، تا ۲۴ ساعت از همین صفحه گزارش بده. برای درخواست بازگشت اثر آماده ۴۸ ساعت فرصت داری.",
      en: "If the work is damaged, report it here within 24 hours. You have 48 hours to ask to return a ready work.",
    },
    slug: "returns",
    section: "window",
  },
  expired: {
    title: { fa: "مهلت پرداخت تمام شد", en: "The payment window closed" },
    body: {
      fa: "اثر به فروشگاه برگشت. اگر مبلغی واریز کرده بودی، با شماره‌ی سفارش پیام بده تا به همان کارت برگردد.",
      en: "The work went back on sale. If you had transferred money, message us with the order number and it goes back to the same card.",
    },
    slug: "buying",
    section: "payment",
  },
  rejected: {
    title: { fa: "پرداخت تأیید نشد", en: "Payment not confirmed" },
    body: {
      fa: "دلیلش را بالاتر نوشته‌ایم. اگر پولی واریز کرده‌ای که به سفارش نرسیده، با شماره‌ی سفارش پیام بده تا برگردانده شود.",
      en: "The reason is above. If you transferred money that didn't reach this order, message us with the order number and it will be returned.",
    },
    slug: "buying",
    section: "confirmation",
  },
  cancelled: {
    title: { fa: "سفارش لغو شد", en: "Order cancelled" },
    body: {
      fa: "اثر به فروشگاه برگشت و هزینه‌ای از تو کم نشده است.",
      en: "The work went back on sale and nothing was charged.",
    },
    slug: "buying",
    section: "cancel",
  },
  returned: {
    title: { fa: "اثر برگشت داده شد", en: "Work returned" },
    body: {
      fa: "مبلغ اثر به کارتی که با آن پرداخت کرده بودی برمی‌گردد.",
      en: "The work's price goes back to the card you paid from.",
    },
    slug: "returns",
    section: "how",
  },
};
