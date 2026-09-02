import type { ProductCategory, ProductVisual } from "@rad/types";

export type SurprisePermission = "faithful" | "hand" | "material";
export type DifferenceStageId = "described" | "imagined" | "artist" | "material";

export const surprisePermissions: Array<{
  id: SurprisePermission;
  title: { fa: string; en: string };
  body: { fa: string; en: string };
}> = [
  {
    id: "faithful",
    title: { fa: "وفادار", en: "Faithful" },
    body: {
      fa: "نزدیک به تصور من بمانید.",
      en: "Stay close to my concept.",
    },
  },
  {
    id: "hand",
    title: { fa: "دستِ هنرمند", en: "Artist’s hand" },
    body: {
      fa: "بازبینی معنادار را بپذیرید.",
      en: "Allow meaningful reinterpretation.",
    },
  },
  {
    id: "material",
    title: { fa: "ماده تصمیم می‌گیرد", en: "Material decides" },
    body: {
      fa: "غافلگیری پخت، بافت و دانه را در آغوش بگیرید.",
      en: "Embrace firing, grain, and texture surprises.",
    },
  },
];

export const differenceStages: Array<{
  id: DifferenceStageId;
  index: { fa: string; en: string };
  title: { fa: string; en: string };
}> = [
  {
    id: "described",
    index: { fa: "۰۱", en: "01" },
    title: { fa: "آنچه توصیف شد", en: "What they described" },
  },
  {
    id: "imagined",
    index: { fa: "۰۲", en: "02" },
    title: { fa: "آنچه هوش مصنوعی تصور کرد", en: "What AI imagined" },
  },
  {
    id: "artist",
    index: { fa: "۰۳", en: "03" },
    title: { fa: "بازخوانی هنرمند", en: "How the artist reinterpreted it" },
  },
  {
    id: "material",
    index: { fa: "۰۴", en: "04" },
    title: { fa: "آنچه ماده ساخت", en: "What the material produced" },
  },
];

export type LocaleCopy = { fa: string; en: string };

export type DifferencePortrait = {
  id: string;
  code: string;
  year: string;
  permission: SurprisePermission;
  category: ProductCategory;
  visual: ProductVisual;
  maker: LocaleCopy;
  described: LocaleCopy;
  imaginedNote: LocaleCopy;
  artistNotes: LocaleCopy[];
  materialNotes: LocaleCopy[];
  fingerprint: {
    clay: LocaleCopy;
    glaze: LocaleCopy;
    firing: LocaleCopy;
    irregularity: LocaleCopy;
  };
  palette: {
    described: { color: string; accent: string };
    imagined: { color: string; accent: string };
    artist: { color: string; accent: string };
    material: { color: string; accent: string };
  };
};

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

const artistTemplates: Record<
  SurprisePermission,
  LocaleCopy[]
> = {
  faithful: [
    {
      fa: "سیاه‌قلم شما را نگه داشتم؛ فقط دیواره را برای ساخت ضخیم‌تر کردم.",
      en: "I kept your silhouette; I only thickened the wall so it could be made.",
    },
    {
      fa: "نسبت دهانه را یک بند انگشت تغییر دادم تا روی میز نلرزد.",
      en: "I shifted the rim by a finger’s width so it would sit without wobble.",
    },
  ],
  hand: [
    {
      fa: "این منحنی را برای تعادل تغییر دادم.",
      en: "I changed this curve for balance.",
    },
    {
      fa: "تقارن کامل را برداشتم؛ دست باید جایی برای ورود داشته باشد.",
      en: "I removed perfect symmetry so the hand would have a place to enter.",
    },
  ],
  material: [
    {
      fa: "لبه را باز گذاشتم تا دو سانتی‌متر آخر را کوره تصمیم بگیرد.",
      en: "I left the rim open so the kiln could decide the last two centimetres.",
    },
    {
      fa: "لعاب را ناهموار مالیدم؛ یکنواختی اینجا دروغ می‌گفت.",
      en: "I applied the glaze unevenly—uniformity would have been a lie here.",
    },
  ],
};

const materialTemplates: Record<SurprisePermission, LocaleCopy[]> = {
  faithful: [
    {
      fa: "رنگ نهایی نیم‌پرده گرم‌تر از تصویر درآمد.",
      en: "The finished colour came half a shade warmer than the image.",
    },
  ],
  hand: [
    {
      fa: "لعاب اینجا حرکت کرد.",
      en: "The glaze moved here.",
    },
    {
      fa: "اثر انگشت روی شانه باقی ماند و آن را پاک نکردم.",
      en: "A fingerprint stayed on the shoulder; I did not wipe it away.",
    },
  ],
  material: [
    {
      fa: "کوره این رنگ غیرمنتظره را ساخت.",
      en: "The kiln created this unexpected colour.",
    },
    {
      fa: "ترک ظریف سطحی بخشی از پوست اثر شد، نه یک خطا.",
      en: "A fine surface crack became skin, not a fault.",
    },
  ],
};

export function composeLivePortrait(input: {
  prompt: string;
  category: ProductCategory;
  visual: ProductVisual;
  permission: SurprisePermission;
  color: string;
  accent: string;
}): DifferencePortrait {
  const stamp = Date.now().toString().slice(-3);
  return {
    id: `live-${stamp}`,
    code: `RAD / ${stamp.padStart(3, "0")}`,
    year: "2026",
    permission: input.permission,
    category: input.category,
    visual: input.visual,
    maker: { fa: "کارگاه رَد، تهران", en: "RAD workshop, Tehran" },
    described: { fa: input.prompt, en: input.prompt },
    imaginedNote: {
      fa: "این تصویر نیت است، نه شیء.",
      en: "This image is intention, not the object.",
    },
    artistNotes: artistTemplates[input.permission],
    materialNotes: materialTemplates[input.permission],
    fingerprint: {
      clay: {
        fa: input.category === "textile" ? "الیاف انتخاب‌شده در کارگاه" : "خاک رس کارگاه تهران",
        en: input.category === "textile" ? "Fibres chosen in the workshop" : "Tehran studio clay",
      },
      glaze: {
        fa: "رفتار سطح وابسته به اجازه غافلگیری شما",
        en: "Surface behaviour follows your permission for surprise",
      },
      firing: {
        fa: input.permission === "material" ? "احیا، مسیر باز برای غافلگیری" : "پخت کنترل‌شده با جای کمی برای ماده",
        en: input.permission === "material" ? "Reduction, path left open for surprise" : "Controlled firing with a little room for material",
      },
      irregularity: {
        fa: "نامنظمی‌های مرئی پس از ساخت ثبت می‌شوند.",
        en: "Visible irregularities are recorded after making.",
      },
    },
    palette: {
      described: { color: "#cbb892", accent: input.accent },
      imagined: { color: input.color, accent: input.accent },
      artist: { color: input.color, accent: "#d8c4a0" },
      material: {
        color: input.permission === "material" ? "#4b513c" : input.color,
        accent: input.permission === "faithful" ? input.accent : "#dbc7a5",
      },
    },
  };
}
