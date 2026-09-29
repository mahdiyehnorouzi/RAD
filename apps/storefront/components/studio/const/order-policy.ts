import type { LocaleCopy } from "@/types/locale";

/**
 * Every custom-order number and rule the visitor sees before sending an idea.
 * Change prices, timing, revisions or cancellation terms here only; the page,
 * the wizard and the review step all read from this file.
 */

export type OrderOverviewStep = {
  id: "idea" | "review" | "quote" | "making";
  title: LocaleCopy;
  note: LocaleCopy;
};

/** The four-beat "how it works" timeline; notes restate `ORDER_PATH`, never new promises. */
export const ORDER_OVERVIEW: OrderOverviewStep[] = [
  {
    id: "idea",
    title: { fa: "ایده‌ی شما", en: "Your idea" },
    note: {
      fa: "عکس، طرح دستی، یادداشت صوتی یا چند خط توضیح؛ هرچه داری بفرست.",
      en: "A photo, a sketch, a voice note or a few lines; send whatever you have.",
    },
  },
  {
    id: "review",
    title: { fa: "بررسی ایده", en: "We review it" },
    note: {
      fa: "می‌بینیم ایده ساختنی است یا نه.",
      en: "We check whether the idea can be made.",
    },
  },
  {
    id: "quote",
    title: { fa: "تأیید و پیشنهاد قیمت", en: "Quote and approval" },
    note: {
      fa: "قیمت، زمان و جزئیات اجرا را پیشنهاد می‌دهیم؛ تا ۲ بار اصلاح طرح.",
      en: "We propose price, timing and approach; up to 2 design revisions.",
    },
  },
  {
    id: "making",
    title: { fa: "ساخت و ارسال", en: "Making and shipping" },
    note: {
      fa: "با بیعانه ساخت شروع می‌شود؛ معمولاً ۲ تا ۳ هفته، بعد ارسال بیمه‌شده.",
      en: "Making starts with the deposit; usually 2–3 weeks, then insured shipping.",
    },
  },
];

export type OrderPriceTier = {
  id: string;
  label: LocaleCopy;
  examples: LocaleCopy;
  price: LocaleCopy;
  image: string;
};

export const ORDER_PRICE_TIERS: OrderPriceTier[] = [
  {
    id: "small",
    label: { fa: "قطعه‌ی کوچک", en: "Small piece" },
    examples: {
      fa: "زیورآلات، آویز، شیء کوچک رومیزی",
      en: "Jewellery, pendants, small desk objects",
    },
    price: { fa: "از ۲ میلیون تومان", en: "from $25" },
    image: "/catalog/photos/transparent/croissant-handle-mug.png",
  },
  {
    id: "vessel",
    label: { fa: "ظرف یا شیء متوسط", en: "Vessel or mid-size object" },
    examples: {
      fa: "ماگ، بشقاب، سینی، گلدان",
      en: "Mugs, plates, trays, vases",
    },
    price: { fa: "از ۳ میلیون تومان", en: "from $35" },
    image: "/catalog/photos/transparent/cobalt-fold-bowl.png",
  },
  {
    id: "complex",
    label: { fa: "شیء پیچیده", en: "Complex object" },
    examples: {
      fa: "مجسمه، چراغ، فرم‌های چندجزئی",
      en: "Sculptures, lamps, detailed forms",
    },
    price: { fa: "از ۵ میلیون تومان", en: "from $60" },
    image: "/catalog/photos/transparent/dachshund-sculpture.png",
  },
  {
    id: "large",
    label: { fa: "قطعه‌ی بزرگ یا چندتکه", en: "Large or multi-part piece" },
    examples: {
      fa: "ست‌ها، قطعه‌های بزرگ‌تر از ۵۰ سانتی‌متر",
      en: "Sets, pieces larger than 50 cm",
    },
    price: { fa: "بعد از بررسی", en: "after review" },
    image: "/catalog/photos/transparent/spotted-loop-teapot.png",
  },
];

export type OrderPathStep = { id: string; title: LocaleCopy; short: LocaleCopy };

export const ORDER_PATH: OrderPathStep[] = [
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
    short: { fa: "با بیعانه، ساخت شروع می‌شود", en: "Making starts with the deposit" },
  },
  {
    id: "making",
    title: { fa: "ساخت", en: "Making" },
    short: { fa: "معمولاً ۲ تا ۳ هفته", en: "Usually 2–3 weeks" },
  },
  {
    id: "result",
    title: { fa: "نتیجه و ارسال", en: "Result and shipping" },
    short: { fa: "ارسال بیمه‌شده به سراسر ایران", en: "Insured shipping across Iran" },
  },
];

export type OrderRule = {
  id: "changes" | "kiln" | "cancel";
  title: LocaleCopy;
  brief: LocaleCopy;
  body: LocaleCopy[];
};

/** The notes repeated, folded, right before the visitor sends the idea. */
export const ORDER_RULES: OrderRule[] = [
  {
    id: "changes",
    title: { fa: "درباره‌ی تغییرات", en: "About changes" },
    brief: { fa: "تا ۲ بار اصلاح، پیش از ساخت", en: "Up to 2 revisions before making" },
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
    brief: { fa: "رنگ و لعاب بعد از کوره کمی فرق می‌کند", en: "Glaze shifts slightly in the kiln" },
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
    brief: { fa: "تا پیش از بیعانه، لغو آزاد است", en: "Free to cancel until the deposit" },
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
