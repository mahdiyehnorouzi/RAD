import type { DifferencePortrait } from "@/components/difference/type";

export const museumPortraits: DifferencePortrait[] = [
  {
    id: "homesickness-bowl",
    code: "RAD / 041",
    year: "2026",
    permission: "material",
    category: "ceramics",
    visual: "vessel",
    maker: { fa: "نیلوفر نادری", en: "Niloufar Naderi" },
    described: {
      fa: "کاسه‌ای که حس دلتنگی را داشته باشد؛ گرم، کمی نامتقارن، شبیه خانه‌ای که دیگر آنجا نیست.",
      en: "A bowl that feels like homesickness: warm, slightly off-balance, like a house that is no longer there.",
    },
    imaginedNote: {
      fa: "هوش مصنوعی دهانه‌ای کاملاً گرد و لعابی یکدست مسی پیشنهاد کرد.",
      en: "AI proposed a perfectly round rim and an even copper glaze.",
    },
    artistNotes: [
      {
        fa: "منحنی دهانه را برای تعادل کمی جمع کردم.",
        en: "I tightened this curve at the rim for balance.",
      },
      {
        fa: "دیواره را نازک‌تر گذاشتم تا وزن مثل خاطره سبک بماند.",
        en: "I thinned the wall so the weight would feel like a memory, not a vessel.",
      },
    ],
    materialNotes: [
      {
        fa: "لعاب در آتش به سمت زیتونی خزید.",
        en: "The glaze drifted toward olive in the fire.",
      },
      {
        fa: "کوره یک شکست رنگی غیرمنتظره روی شانه ساخت.",
        en: "The kiln left an unexpected colour break on the shoulder.",
      },
    ],
    fingerprint: {
      clay: { fa: "بتن خاک رس شمیران، دسته ۱۴۰۵-۰۳", en: "Shemiran stoneware, batch 1405-03" },
      glaze: { fa: "خاکستر گردو + اکسید آهن، خزیدن افقی", en: "Walnut ash + iron oxide, lateral crawl" },
      firing: { fa: "احیا، ۱۲۲۸ درجه، خنک‌سازی آهسته", en: "Reduction, 1228°C, slow cool" },
      irregularity: { fa: "لبه نازک و یک قطره لعاب خشک‌شده", en: "Thinned lip and one dried glaze tear" },
    },
    palette: {
      described: { color: "#cbb892", accent: "#8a4938" },
      imagined: { color: "#9f4030", accent: "#ead9bd" },
      artist: { color: "#87382c", accent: "#d8c4a0" },
      material: { color: "#4b513c", accent: "#dbc7a5" },
    },
  },
  {
    id: "tehran-alley-vase",
    code: "RAD / 044",
    year: "2026",
    permission: "hand",
    category: "ceramics",
    visual: "vessel",
    maker: { fa: "سامان کریمی", en: "Saman Karimi" },
    described: {
      fa: "گلدانی شکل‌گرفته از یک کوچه فراموش‌شده تهران؛ باریک، سایه‌دار، با نوری که فقط ظهر می‌رسد.",
      en: "A vase shaped by a forgotten Tehran alley: narrow, shadowed, with light that arrives only at noon.",
    },
    imaginedNote: {
      fa: "تصویر اولیه فرمی مجسمه‌وار و متقارن با سایه‌های گرافیکی ساخت.",
      en: "The first image made a sculptural, symmetrical form with graphic shadows.",
    },
    artistNotes: [
      {
        fa: "ارتفاع را کوتاه کردم تا شبیه فاصله دو دیوار کوچه شود، نه یک بنای یادمانی.",
        en: "I shortened the height so it would feel like the space between two walls, not a monument.",
      },
      {
        fa: "یک فرورفتگی عمودی گذاشتم؛ جای نوری که فقط ظهر می‌رسد.",
        en: "I cut a vertical recess—the place where noon light would fall.",
      },
    ],
    materialNotes: [
      {
        fa: "خاک رس روی شانه دانه‌درشت ماند.",
        en: "The clay kept a coarse grain on the shoulder.",
      },
      {
        fa: "سایه لعاب مات عمیق‌تر از طرح درآمد.",
        en: "The matte glaze shadow came out deeper than the drawing.",
      },
    ],
    fingerprint: {
      clay: { fa: "مخلوط رس و ماسه رودخانه کرج", en: "Clay mixed with Karaj river sand" },
      glaze: { fa: "مات کربنی، پوشش ناقص تعمدی", en: "Carbon matte, deliberately incomplete cover" },
      firing: { fa: "اکسید، ۱۱۸۰ درجه", en: "Oxidation, 1180°C" },
      irregularity: { fa: "خط افقی دست روی بدنه باقی ماند", en: "A horizontal hand-line remains on the body" },
    },
    palette: {
      described: { color: "#d6cfc3", accent: "#263d34" },
      imagined: { color: "#31534a", accent: "#d87855" },
      artist: { color: "#243e35", accent: "#cbb892" },
      material: { color: "#18231f", accent: "#8a4938" },
    },
  },
  {
    id: "quiet-cloth",
    code: "RAD / 052",
    year: "2026",
    permission: "faithful",
    category: "textile",
    visual: "textile",
    maker: { fa: "مهتاب رضوی", en: "Mahtab Razavi" },
    described: {
      fa: "دیوارکوبی آرام با خطوط آزاد خاکی که بشود هر روز به آن نگاه کرد.",
      en: "A quiet wall hanging with free earth lines, something one could look at every day.",
    },
    imaginedNote: {
      fa: "هوش مصنوعی شبکه‌ای منظم از خطوط متقاطع پیشنهاد کرد.",
      en: "AI suggested a regular lattice of crossing lines.",
    },
    artistNotes: [
      {
        fa: "خطوط را از هم باز کردم تا چشم جایی برای ماندن داشته باشد.",
        en: "I opened the lines so the eye would have somewhere to rest.",
      },
    ],
    materialNotes: [
      {
        fa: "رنگ گیاهی روی پشم کمی به زرد متمایل شد.",
        en: "The plant dye on wool drifted slightly toward yellow.",
      },
    ],
    fingerprint: {
      clay: { fa: "پشم دست‌ریس مازندران", en: "Hand-spun Mazandaran wool" },
      glaze: { fa: "رنگرزی پوست انار و روناس", en: "Pomegranate rind and madder dye" },
      firing: { fa: "ثابت‌سازی بخار، دو روز", en: "Steam set, two days" },
      irregularity: { fa: "یک گره شل در حاشیه پایین", en: "One loosened knot on the lower edge" },
    },
    palette: {
      described: { color: "#e9d7b9", accent: "#b86449" },
      imagined: { color: "#b86449", accent: "#e9d7b9" },
      artist: { color: "#8a4938", accent: "#cbb892" },
      material: { color: "#76523b", accent: "#ead9bd" },
    },
  },
];

export function portraitById(id: string) {
  return museumPortraits.find((item) => item.id === id);
}
