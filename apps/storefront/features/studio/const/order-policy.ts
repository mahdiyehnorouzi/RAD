import type { LocaleCopy } from "@/types/locale";

/**
 * Every custom-order number and rule the visitor sees before sending an idea.
 * Change prices, timing, revisions or cancellation terms here only; the page,
 * the wizard and the review step all read from this file.
 */

export type OrderStep = {
  id: "idea" | "design" | "making";
  title: LocaleCopy;
  note: LocaleCopy;
};

/** The three-beat "how it works" timeline shown on the Studio landing page. */
export const ORDER_STEPS: OrderStep[] = [
  {
    id: "idea",
    title: { fa: "بگو چی تو ذهنته", en: "Tell us your idea" },
    note: {
      fa: "یه عکس، یه نقاشی یا حتی چند تا جمله کافیه.",
      en: "A photo, a sketch, or a few lines.",
    },
  },
  {
    id: "design",
    title: { fa: "با هم سر و شکلش می‌دیم", en: "We design it together" },
    note: {
      fa: "درباره‌ی رنگ، اندازه و جزئیاتش با هم تصمیم می‌گیریم.",
      en: "We work out the details and material.",
    },
  },
  {
    id: "making",
    title: { fa: "می‌سازیمش، می‌فرستیمش", en: "Made and shipped" },
    note: {
      fa: "می‌ره توی کارگاه و وقتی آماده شد، میاد پیشت.",
      en: "Made with care, just for you.",
    },
  },
];

type OrderPathStep = { id: string; title: LocaleCopy; short: LocaleCopy };

const ORDER_PATH: OrderPathStep[] = [
  {
    id: "review",
    title: { fa: "بررسی ایده", en: "Idea review" },
    short: { fa: "می‌بینیم ساختنی است یا نه", en: "We check it can be made" },
  },
  {
    id: "proposal",
    title: { fa: "پیشنهاد رَد", en: "RAD proposal" },
    short: { fa: "قیمت، زمان و جزئیات اجرا", en: "Price, timing and approach" },
  },
  {
    id: "approval",
    title: { fa: "تأیید تو", en: "Your approval" },
    short: { fa: "تا ۲ بار اصلاح طرح", en: "Up to 2 design revisions" },
  },
  {
    id: "deposit",
    title: { fa: "بیعانه", en: "Deposit" },
    short: {
      fa: "با بیعانه، ساخت شروع می‌شود",
      en: "Making starts with the deposit",
    },
  },
  {
    id: "making",
    title: { fa: "ساخت", en: "Making" },
    short: { fa: "معمولاً ۲ تا ۳ هفته", en: "Usually 2–3 weeks" },
  },
  {
    id: "result",
    title: { fa: "نتیجه و ارسال", en: "Result and shipping" },
    short: {
      fa: "ارسال بیمه‌شده به سراسر ایران",
      en: "Insured shipping across Iran",
    },
  },
];

type OrderRule = {
  id: "changes" | "kiln" | "cancel";
  title: LocaleCopy;
  brief: LocaleCopy;
  body: LocaleCopy[];
};

/** The notes repeated, folded, right before the visitor sends the idea. */
const ORDER_RULES: OrderRule[] = [
  {
    id: "changes",
    title: { fa: "درباره‌ی تغییرات", en: "About changes" },
    brief: {
      fa: "تا ۲ بار اصلاح، پیش از ساخت",
      en: "Up to 2 revisions before making",
    },
    body: [
      {
        fa: "جزئیات سفارش پیش از شروع ساخت با تو نهایی می‌شود. تا ۲ بار اصلاح طرح در این مرحله جزو سفارش است.",
        en: "Order details are finalised with you before making starts. Up to 2 design revisions are included at that stage.",
      },
      {
        fa: "بعد از شروع ساخت، تغییرات اساسی ممکن است شدنی نباشد یا هزینه‌ی اضافه داشته باشد.",
        en: "Once making has started, major changes may not be possible or may cost extra.",
      },
    ],
  },
  {
    id: "kiln",
    title: { fa: "نکته‌ای درباره‌ی سرامیک", en: "A note about ceramics" },
    brief: {
      fa: "رنگ و لعاب بعد از کوره کمی فرق می‌کند",
      en: "Glaze shifts slightly in the kiln",
    },
    body: [
      {
        fa: "نتیجه‌ی نهایی به‌خاطر فرایند ساخت و پخت در کوره ممکن است کمی با تصویر یا مرجع اولیه فرق داشته باشد؛ مخصوصاً در رنگ، لعاب و بافت.",
        en: "Because of making and kiln firing, the final piece may differ slightly from the original image or reference, especially in colour, glaze and texture.",
      },
      {
        fa: "پیش از شروع ساخت، درباره‌ی این تفاوت‌ها با تو هماهنگ می‌کنیم.",
        en: "We talk these differences through with you before making starts.",
      },
    ],
  },
  {
    id: "cancel",
    title: { fa: "اگر نظرم عوض شد؟", en: "What if I change my mind?" },
    brief: {
      fa: "تا پیش از بیعانه، لغو آزاد است",
      en: "Free to cancel until the deposit",
    },
    body: [
      {
        fa: "تا پیش از تأیید نهایی و پرداخت بیعانه، درخواست را می‌توانی لغو کنی.",
        en: "You can cancel the request any time before final approval and deposit.",
      },
      {
        fa: "بعد از شروع ساخت، هزینه‌ی مواد و کاری که تا آن لحظه انجام شده از بیعانه کم می‌شود و باقی‌مانده برمی‌گردد.",
        en: "Once making has started, materials and work done so far come out of the deposit and the rest is refunded.",
      },
      {
        fa: "بعد از پایان ساخت، چون اثر فقط برای تو ساخته شده، لغو ممکن نیست.",
        en: "Once the piece is finished, it was made only for you, so it can't be cancelled.",
      },
    ],
  },
];
