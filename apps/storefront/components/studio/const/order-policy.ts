import type { LocaleCopy } from "@/types/locale";

/**
 * Every custom-order number and rule the visitor sees before sending an idea.
 * Change prices, timing, revisions or cancellation terms here only; the page,
 * the wizard and the review step all read from this file.
 */

export type OrderFact = { id: string; value: LocaleCopy; note: LocaleCopy };

export const ORDER_FACTS: OrderFact[] = [
  {
    id: "price",
    value: { fa: "از حدود ۲ میلیون تومان", en: "From around $25" },
    note: {
      fa: "قیمت نهایی بعد از بررسی ایده مشخص می‌شود.",
      en: "The final price is set after we review the idea.",
    },
  },
  {
    id: "time",
    value: { fa: "۲ تا ۳ هفته", en: "2–3 weeks" },
    note: {
      fa: "زمان تقریبی ساخت، از تأیید نهایی و پرداخت بیعانه.",
      en: "Estimated making time, counted from approval and deposit.",
    },
  },
  {
    id: "revisions",
    value: { fa: "۱ تا ۲ مرحله اصلاح", en: "1–2 refinement rounds" },
    note: {
      fa: "پیش از ساخت، روی فرم، رنگ و جزئیات به توافق می‌رسیم.",
      en: "Before making, we agree on form, colour and details.",
    },
  },
  {
    id: "deposit",
    value: { fa: "شروع با بیعانه", en: "Deposit to start" },
    note: {
      fa: "ساخت بعد از تأیید نهایی و پرداخت بیعانه شروع می‌شود.",
      en: "Making starts after final approval and the deposit.",
    },
  },
];

export type OrderPriceTier = {
  id: string;
  label: LocaleCopy;
  examples: LocaleCopy;
  price: LocaleCopy;
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
  },
  {
    id: "vessel",
    label: { fa: "ظرف، ماگ یا شیء متوسط", en: "Vessel, mug or mid-size object" },
    examples: {
      fa: "ماگ، بشقاب، سینی، گلدان",
      en: "Mugs, plates, trays, vases",
    },
    price: { fa: "از ۳ میلیون تومان", en: "from $35" },
  },
  {
    id: "complex",
    label: { fa: "شیء پیچیده", en: "Complex object" },
    examples: {
      fa: "مجسمه، چراغ، فرم‌های چندجزئی",
      en: "Sculptures, lamps, detailed forms",
    },
    price: { fa: "از ۵ میلیون تومان", en: "from $60" },
  },
  {
    id: "large",
    label: { fa: "قطعه‌ی بزرگ یا چندتکه", en: "Large or multi-part piece" },
    examples: {
      fa: "ست‌ها، قطعه‌های بزرگ‌تر از ۵۰ سانتی‌متر",
      en: "Sets, pieces larger than 50 cm",
    },
    price: { fa: "بعد از بررسی", en: "after review" },
  },
];

export type OrderPathStep = { id: string; title: LocaleCopy; body: LocaleCopy };

export const ORDER_PATH: OrderPathStep[] = [
  {
    id: "review",
    title: { fa: "بررسی ایده", en: "Idea review" },
    body: {
      fa: "ایده، مرجع‌ها و جزئیات را می‌خوانیم و می‌بینیم ساختنی است یا نه.",
      en: "We read the idea, references and details, and check it can be made.",
    },
  },
  {
    id: "proposal",
    title: { fa: "پیشنهاد رَد", en: "RAD proposal" },
    body: {
      fa: "قیمت، زمان ساخت و جزئیات اجرا را برایت می‌فرستیم.",
      en: "We send you the price, making time and how it will be made.",
    },
  },
  {
    id: "approval",
    title: { fa: "تأیید تو", en: "Your approval" },
    body: {
      fa: "اگر همه‌چیز را پذیرفتی، سفارش نهایی می‌شود.",
      en: "If everything works for you, the order is confirmed.",
    },
  },
  {
    id: "deposit",
    title: { fa: "بیعانه", en: "Deposit" },
    body: {
      fa: "با پرداخت بیعانه، ساخت شروع می‌شود.",
      en: "Once the deposit is paid, making begins.",
    },
  },
  {
    id: "making",
    title: { fa: "ساخت", en: "Making" },
    body: {
      fa: "روند ساخت و زمان تقریبی را با تو به اشتراک می‌گذاریم.",
      en: "We share the making process and timing with you as it goes.",
    },
  },
  {
    id: "result",
    title: { fa: "نتیجه و ارسال", en: "Result and shipping" },
    body: {
      fa: "اثر ساخته، بررسی و برای ارسال آماده می‌شود.",
      en: "The piece is finished, checked and prepared for shipping.",
    },
  },
];

export type OrderRule = {
  id: string;
  title: LocaleCopy;
  body: LocaleCopy[];
  /** Shown again, shortened, right before the visitor sends the idea. */
  brief?: LocaleCopy;
};

export const ORDER_RULES: OrderRule[] = [
  {
    id: "price",
    title: { fa: "قیمت", en: "Price" },
    body: [
      {
        fa: "قیمت‌های اعلام‌شده نقطه‌ی شروع‌اند. قیمت نهایی به ابعاد، ماده، جزئیات و پیچیدگی بستگی دارد و پیش از شروع ساخت با تو تأیید می‌شود.",
        en: "Listed prices are starting points. The final price depends on size, material, detail and complexity, and is confirmed with you before making starts.",
      },
    ],
  },
  {
    id: "time",
    title: { fa: "زمان", en: "Time" },
    body: [
      {
        fa: "ساخت معمولاً ۲ تا ۳ هفته از تأیید نهایی و پرداخت بیعانه طول می‌کشد. زمان دقیق هر سفارش در پیشنهاد رَد می‌آید.",
        en: "Making usually takes 2–3 weeks from final approval and deposit. The exact time for your piece comes with the RAD proposal.",
      },
    ],
  },
  {
    id: "changes",
    title: { fa: "درباره‌ی تغییرات", en: "About changes" },
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
    brief: {
      fa: "تا ۲ بار اصلاح طرح پیش از ساخت؛ بعد از شروع ساخت، تغییر اساسی ممکن است شدنی نباشد.",
      en: "Up to 2 revisions before making; after making starts, major changes may not be possible.",
    },
  },
  {
    id: "kiln",
    title: { fa: "نکته‌ای درباره‌ی سرامیک", en: "A note about ceramics" },
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
    brief: {
      fa: "رنگ، لعاب و بافت بعد از کوره ممکن است کمی با مرجع فرق کند.",
      en: "Colour, glaze and texture may shift slightly in the kiln.",
    },
  },
  {
    id: "cancel",
    title: { fa: "اگر نظرم عوض شد؟", en: "What if I change my mind?" },
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
    brief: {
      fa: "تا پیش از تأیید و بیعانه، لغو آزاد است.",
      en: "Cancelling is free until approval and deposit.",
    },
  },
  {
    id: "shipping",
    title: { fa: "ارسال", en: "Shipping" },
    body: [
      {
        fa: "اثر بعد از بررسی نهایی، با بسته‌بندی امن و بیمه به سراسر ایران ارسال می‌شود. مانده‌ی حساب پیش از ارسال پرداخت می‌شود.",
        en: "After a final check, the piece ships insured and carefully packed across Iran. The remaining balance is paid before shipping.",
      },
    ],
  },
];
