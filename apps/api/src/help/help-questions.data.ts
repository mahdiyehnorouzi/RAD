import type { HelpQuestionView } from "./type";

/** Help-page questions inserted once on an empty database; staff edit them in the admin. */
export const defaultHelpQuestions: HelpQuestionView[] = [
  {
    id: "confirm",
    question: {
      fa: "بعد از کارت‌به‌کارت، سفارشم چطور تأیید می‌شه؟",
      en: "After a card-to-card transfer, how is my order confirmed?",
    },
    answer: {
      fa: "رسید و شماره‌ی پیگیری رو از صفحه‌ی سفارش می‌فرستی. یه نفر از رَد اون رو با واریزی حساب تطبیق می‌ده و نتیجه رو همون‌جا و توی اعلان‌ها می‌بینی. تا وقتی بررسی تموم نشده، اثر برای تو می‌مونه.",
      en: "You send the receipt and tracking number from your order page. A person at RAD matches it with the transfer, and you see the result there and in your notifications. The work stays yours until the check is done.",
    },
    more: { slug: "buying", section: "confirmation" },
  },
  {
    id: "window",
    question: {
      fa: "اگه ۳۰ دقیقه‌ی پرداخت تموم بشه چی؟",
      en: "What if the 30 minutes to pay run out?",
    },
    answer: {
      fa: "اگه تا اون موقع رسید نفرستاده باشی، سفارش منقضی می‌شه و اثر به فروشگاه برمی‌گرده. اگه پول رو واریز کرده بودی ولی رسید نرسید، با شماره‌ی سفارش بهمون پیام بده.",
      en: "If no receipt has arrived by then, the order expires and the work goes back on sale. If you had already transferred the money, message us with the order number.",
    },
    more: { slug: "buying", section: "payment" },
  },
  {
    id: "damage",
    question: {
      fa: "اگه اثر توی مسیر آسیب ببینه چی؟",
      en: "What if the work is damaged on the way?",
    },
    answer: {
      fa: "تا ۲۴ ساعت بعد از تحویل، از صفحه‌ی سفارش با یه عکس از جعبه و یه عکس از آسیب گزارش بده. اگه تأیید بشه، اثر مرمت می‌شه یا کل مبلغش برمی‌گرده.",
      en: "Within 24 hours of delivery, report it from your order page with a photo of the box and one of the damage. If confirmed, the work is repaired or fully refunded.",
    },
    more: { slug: "returns", section: "damage" },
  },
  {
    id: "change-mind",
    question: {
      fa: "اگه نظرم درباره‌ی یه اثر آماده عوض شد؟",
      en: "What if I change my mind about a ready work?",
    },
    answer: {
      fa: "تا ۴۸ ساعت بعد از تحویل می‌تونی درخواست بازگشت بدی، بدون اینکه دلیلش رو بگی. اثر باید سالم و توی بسته‌بندی اصلی برگرده و هزینه‌ی ارسال برگشت با خودته.",
      en: "You can ask to return it within 48 hours of delivery, no reason needed. It must come back undamaged in its original packaging, and you pay the return shipping.",
    },
    more: { slug: "returns", section: "window" },
  },
  {
    id: "glaze",
    question: {
      fa: "اگه رنگ لعاب با عکس فرق داشته باشه چی؟",
      en: "What if the glaze colour differs from the photo?",
    },
    answer: {
      fa: "نمایشگرها و کوره هر دو رنگ رو کمی جابه‌جا می‌کنن و این تفاوت کوچیک بخشی از اثر یگانه‌ست. ولی اگه برات پذیرفتنی نبود، اثر آماده رو می‌تونی توی مهلت بازگشت برگردونی.",
      en: "Screens and the kiln both shift colour a little, and that small difference is part of a one-of-one work. If it doesn't work for you, you can return a ready work within the return window.",
    },
    more: { slug: "returns", section: "natural" },
  },
  {
    id: "custom-cancel",
    question: {
      fa: "می‌تونم سفارش اختصاصی رو لغو کنم؟",
      en: "Can I cancel a custom order?",
    },
    answer: {
      fa: "تا قبل از تأیید نهایی و بیعانه، بله و بدون هزینه. بعد از شروع ساخت، هزینه‌ی مواد و کار انجام‌شده از بیعانه کم می‌شه و بقیه‌اش برمی‌گرده.",
      en: "Yes, free of charge, until final approval and the deposit. Once making starts, the cost of materials and work done is taken from the deposit and the rest is returned.",
    },
    more: { slug: "custom", section: "cancel" },
  },
  {
    id: "shipping",
    question: {
      fa: "ارسال چگونه است؟",
      en: "How is it sent?",
    },
    answer: {
      fa: "پس از آماده‌شدن اثر، سفارش‌های تهران با پست یا پیک و سفارش‌های شهرهای دیگر با پست ارسال می‌شوند.",
      en: "After the work is ready, Tehran orders are sent by post or courier; orders to other cities are sent by post.",
    },
    more: { slug: "shipping", section: "method" },
  },
  {
    id: "card-data",
    question: {
      fa: "اطلاعات پرداختم کجا می‌ره؟",
      en: "Where do my payment details go?",
    },
    answer: {
      fa: "فقط تصویر رسید و شماره‌ی پیگیری رو نگه می‌داریم تا با واریزی تطبیق بدیم. شماره‌ی کامل کارت یا رمزش رو هیچ‌وقت ازت نمی‌خوایم.",
      en: "We keep only the receipt image and tracking number, to match your transfer. We never ask for your full card number or PIN.",
    },
    more: { slug: "privacy", section: "collect" },
  },
];
