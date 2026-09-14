import type { BeforeRadFrame, RadPassport } from "@/components/passport/type";
import { catalogPhotoSrc, photoWorks } from "@/lib/catalog/photo-works";
import { museumPortraits } from "@/lib/difference";
import type { LocaleCopy } from "@/types/locale";
import type { Product } from "@rad/types";

function copy(fa: string, en: string): LocaleCopy {
  return { fa, en };
}

function padCode(value: string | number) {
  return String(value).replace(/\D/g, "").padStart(3, "0");
}

function productCode(product: Product) {
  return padCode(product.artworkNumber || "0");
}

const featured: RadPassport[] = [
  {
    code: "007",
    slug: "kaj-dasteh",
    productSlug: "croissant-handle-mug",
    category: "ceramics",
    name: copy("کج‌دسته", "Crooked Handle"),
    maker: copy("سحر میرزایی", "Sahar Mirzaei"),
    dateCreated: copy("اردیبهشت ۱۴۰۵", "April 2026"),
    clay: copy("استون‌ور شمیران، دسته ۱۴۰۵-۰۲", "Shemiran stoneware, batch 1405-02"),
    glaze: copy("شیر خام و شکلاتی روان", "Raw cream body, flowing chocolate glaze"),
    dimensions: copy("ارتفاع ۹ سانتی‌متر، دهانه ۸ سانتی‌متر", "9 cm high, 8 cm rim"),
    firing: copy("اکسید، ۱۱۸۴ درجه، خنک‌سازی آهسته", "Oxidation, 1184°C, slow cool"),
    inspiration: copy(
      "دسته‌ای که نباید صاف می‌نشست. یک کروسان مانده روی میز کارگاه، و میل به اینکه شیء روزمره کمی منحرف باشد.",
      "A handle that refused to sit straight. A leftover croissant on the bench, and the wish that an everyday object would lean.",
    ),
    firstSketch: {
      src: "/making/RAD-M-1405-17/forming.png",
      note: copy("اولین فرم روی چرخ؛ دسته هنوز جدا بود.", "First form on the wheel; the handle was still separate."),
    },
    construction: [
      {
        src: "/making/RAD-M-1405-17/forming.png",
        note: copy("بدنه پیش از اتصال دسته", "Body before the handle was joined"),
      },
      {
        src: "/making/RAD-M-1405-17/cleaned.png",
        note: copy("تراش و پاک‌کردن درز دسته", "Cleaning the handle join"),
      },
      {
        src: "/making/RAD-M-1405-17/glaze-tile.png",
        note: copy("نمونه لعاب شکلاتی روی تایل", "Chocolate glaze test on a tile"),
      },
    ],
    unexpectedChanges: copy(
      "در کوره دسته کمی بیشتر خم شد. آن را برنگرداندیم. کجی همان چیزی است که این رَد را رَد کرد.",
      "In the kiln the handle bent a little further. We left it. That lean is what made this RAD a RAD.",
    ),
    finalPhotos: [
      {
        src: catalogPhotoSrc("croissant-handle-mug"),
        note: copy("پس از کوره، نور کارگاه", "After the kiln, workshop light"),
      },
      {
        src: catalogPhotoSrc("croissant-handle-mug", 1),
        note: copy("نمای دوم؛ نوشته روی بدنه", "Second view; lettering on the body"),
      },
    ],
    owner: copy("سارا", "Sara"),
    city: copy("تهران", "Tehran"),
    care: copy(
      "فقط دست‌شوی، آب ولرم، بدون شوک حرارتی. دسته را از بدنه نگیرید؛ از کمر ظرف بلند کنید.",
      "Hand wash only, lukewarm water, no thermal shock. Lift from the body, not the handle.",
    ),
    familyId: "kaj-dasteh",
    inspiredBy: "017",
    inspiredNote: copy("الهام از همان کجی", "Inspired by that same lean"),
    traits: { crooked: 0.95, quiet: 0.35, worn: 0.7, surprise: 0.8, strange: 0.85 },
    marks: [
      {
        x: 78,
        y: 42,
        title: copy("دسته", "Handle"),
        note: copy(
          "این قسمت کمی پایین‌تر آمده. هنگام خشک‌شدن فرم خودش را تغییر داده. درستش نکردیم.",
          "This part sat a little lower. The form shifted while drying. We did not correct it.",
        ),
      },
      {
        x: 36,
        y: 28,
        title: copy("لبه", "Rim"),
        note: copy("اینجا لعاب جمع شده.", "The glaze gathered here."),
      },
      {
        x: 52,
        y: 68,
        title: copy("بدنه", "Body"),
        note: copy("اثر انگشت سازنده اینجا مانده.", "The maker's fingerprint is still here."),
      },
    ],
    transfers: [
      {
        from: copy("مهدیه", "Mahdiyeh"),
        to: copy("سارا", "Sara"),
        when: copy("زمستان ۱۴۰۶", "Winter 1406"),
      },
    ],
    sold: true,
    whereabouts: {
      current: copy("تهران → خانه‌ی سارا", "Tehran → Sara's home"),
      trail: [
        {
          place: copy("کارگاه رَد", "RAD workshop"),
          note: copy("شکل گرفت و پخته شد", "Formed and fired"),
        },
        {
          place: copy("قفسه آرشیو", "Archive shelf"),
          note: copy("شماره ۰۰۷ نشست", "Number 007 was given"),
        },
        {
          place: copy("خانه‌ی سارا", "Sara's home"),
          note: copy("از مهدیه رسید", "It arrived from Mahdiyeh"),
        },
      ],
    },
    beforeRad: [
      {
        id: "idea",
        src: "/making/RAD-M-1405-17/forming.png",
        color: "#eee3cf",
        accent: "#9d5d2d",
        caption: copy("کروسان روی میز؛ میل به دستهٔ کج", "A croissant on the bench; the wish for a crooked handle"),
      },
      {
        id: "hand",
        src: "/making/RAD-M-1405-17/cleaned.png",
        color: "#ead9bd",
        accent: "#8a4938",
        caption: copy("دست دسته را جایی گذاشت که صاف نبود", "The hand set the handle where it would not sit straight"),
      },
      {
        id: "material",
        src: "/making/RAD-M-1405-17/glaze-tile.png",
        color: "#cbb892",
        accent: "#9d5d2d",
        caption: copy("لعاب از لبه سرازیر شد", "The glaze ran from the rim"),
      },
      {
        id: "rad",
        src: catalogPhotoSrc("croissant-handle-mug"),
        color: "#eee3cf",
        accent: "#9d5d2d",
        caption: copy("آنچه از کوره بیرون آمد", "What came out of the kiln"),
      },
    ],
  },
  {
    code: "017",
    slug: "kaj-dasteh-first",
    familyId: "kaj-dasteh",
    category: "ceramics",
    name: copy("کج‌دستهٔ اول", "First Crooked Handle"),
    maker: copy("سحر میرزایی", "Sahar Mirzaei"),
    dateCreated: copy("اسفند ۱۴۰۴", "March 2026"),
    clay: copy("استون‌ور شمیران", "Shemiran stoneware"),
    glaze: copy("شیر خام، بدون شکلات", "Raw cream, no chocolate"),
    dimensions: copy("ارتفاع ۸ سانتی‌متر", "8 cm high"),
    firing: copy("اکسید، ۱۱۸۰ درجه", "Oxidation, 1180°C"),
    inspiration: copy(
      "اولین باری که دسته اجازه یافت کج بنشیند.",
      "The first time a handle was allowed to sit crooked.",
    ),
    construction: [
      {
        src: "/making/RAD-M-1405-17/forming.png",
        note: copy("اولین فرم", "The first form"),
      },
    ],
    unexpectedChanges: copy(
      "دسته در خشک شدن خم شد. همان را نگه داشتیم.",
      "The handle bent while drying. We kept it.",
    ),
    finalPhotos: [
      {
        src: "/making/RAD-M-1405-17/cleaned.png",
        note: copy("پس از تراش", "After cleaning"),
      },
    ],
    owner: copy("در آرشیو رَد", "In the RAD archive"),
    city: copy("تهران", "Tehran"),
    care: copy("دست‌شوی. این قطعه دیگر فروخته نمی‌شود.", "Hand wash. This piece is no longer sold."),
    traits: { crooked: 0.9, quiet: 0.5, worn: 0.6, surprise: 0.55, strange: 0.7 },
    sold: true,
    whereabouts: {
      current: copy("تهران → آرشیو کارگاه", "Tehran → the workshop archive"),
      trail: [{ place: copy("آرشیو رَد", "RAD archive"), note: copy("نگاه داشته می‌شود", "It is kept") }],
    },
    beforeRad: [
      {
        id: "idea",
        src: "/making/RAD-M-1405-17/forming.png",
        color: "#eee3cf",
        accent: "#8a4938",
        caption: copy("میل به کجی", "The wish to lean"),
      },
      {
        id: "hand",
        src: "/making/RAD-M-1405-17/cleaned.png",
        color: "#ead9bd",
        accent: "#8a4938",
        caption: copy("دست دسته را رها کرد", "The hand let the handle go"),
      },
      {
        id: "material",
        src: "/making/RAD-M-1405-17/cleaned.png",
        color: "#cbb892",
        accent: "#8a4938",
        caption: copy("خشک شدن مسیر را عوض کرد", "Drying changed the path"),
      },
      {
        id: "rad",
        src: "/making/RAD-M-1405-17/cleaned.png",
        color: "#eee3cf",
        accent: "#8a4938",
        caption: copy("کج‌دستهٔ اول", "The first crooked handle"),
      },
    ],
  },
  {
    code: "029",
    slug: "haleh",
    familyId: "haleh",
    category: "ceramics",
    name: copy("هاله", "Halo"),
    maker: copy("نیلوفر نادری", "Niloufar Naderi"),
    dateCreated: copy("اردیبهشت ۱۴۰۵", "April 2026"),
    clay: copy("استون‌ور شمیران", "Shemiran stoneware"),
    glaze: copy("هالهٔ زیتونی روی کرم", "An olive halo on cream"),
    dimensions: copy("دهانه ۱۶ سانتی‌متر", "16 cm rim"),
    firing: copy("احیا، ۱۲۲۰ درجه", "Reduction, 1220°C"),
    inspiration: copy(
      "نوری که دور یک شیء می‌ماند، نه خودِ شیء.",
      "The light that stays around an object, not the object itself.",
    ),
    construction: [
      {
        src: "/difference/homesickness-bowl/artist-v3.jpg",
        note: copy("فرم پیش از هاله", "The form before the halo"),
      },
    ],
    unexpectedChanges: copy(
      "هاله در کوره یک انگشت پهن‌تر شد.",
      "In the kiln the halo widened by a finger.",
    ),
    finalPhotos: [
      {
        src: "/difference/homesickness-bowl/material-v3.jpg",
        note: copy("هاله بعد از آتش", "The halo after the fire"),
      },
    ],
    owner: copy("سارا", "Sara"),
    city: copy("تهران", "Tehran"),
    care: copy("دست‌شوی. لبه نازک را نزنید.", "Hand wash. Do not knock the thinned lip."),
    traits: { crooked: 0.25, quiet: 0.85, worn: 0.45, surprise: 0.75, strange: 0.4 },
    sold: true,
    whereabouts: {
      current: copy("تهران → مجموعه‌ی سارا", "Tehran → Sara's collection"),
      trail: [{ place: copy("خانه‌ی سارا", "Sara's home"), note: copy("کنار کج‌دسته", "Beside Crooked Handle") }],
    },
    beforeRad: framesFromPortrait("homesickness-bowl"),
  },
  {
    code: "031",
    slug: "kaj-dasteh-colour",
    familyId: "kaj-dasteh",
    inspiredBy: "007",
    inspiredNote: copy("آزمایش رنگ روی همان دسته", "A colour experiment on the same handle"),
    category: "ceramics",
    name: copy("کج‌دستهٔ آزمایش رنگ", "Crooked Handle, colour trial"),
    maker: copy("سحر میرزایی", "Sahar Mirzaei"),
    dateCreated: copy("خرداد ۱۴۰۵", "May 2026"),
    clay: copy("استون‌ور شمیران", "Shemiran stoneware"),
    glaze: copy("شکلاتی غلیظ‌تر، خزیدن بیشتر", "Thicker chocolate, more crawl"),
    dimensions: copy("ارتفاع ۹ سانتی‌متر", "9 cm high"),
    firing: copy("اکسید، ۱۱۸۸ درجه", "Oxidation, 1188°C"),
    inspiration: copy(
      "اگر همان دسته را با لعاب دیگری بسوزانیم چه می‌شود؟",
      "What if the same handle was fired with another glaze?",
    ),
    construction: [
      {
        src: "/making/RAD-M-1405-17/glaze-tile.png",
        note: copy("نمونه رنگ", "Colour test"),
      },
    ],
    unexpectedChanges: copy(
      "لعاب از دسته پایین آمد و یک خط تیره ساخت.",
      "The glaze ran off the handle and left a dark line.",
    ),
    finalPhotos: [
      {
        src: catalogPhotoSrc("croissant-handle-mug", 1),
        note: copy("نسخه آزمایش رنگ", "The colour-trial version"),
      },
    ],
    owner: copy("در آرشیو رَد", "In the RAD archive"),
    city: copy("تهران", "Tehran"),
    care: copy("دست‌شوی.", "Hand wash."),
    traits: { crooked: 0.88, quiet: 0.3, worn: 0.75, surprise: 0.9, strange: 0.8 },
    sold: true,
    whereabouts: {
      current: copy("تهران → آرشیو کارگاه", "Tehran → the workshop archive"),
      trail: [{ place: copy("آرشیو رَد", "RAD archive"), note: copy("نگاه داشته می‌شود", "It is kept") }],
    },
    beforeRad: [
      {
        id: "idea",
        src: catalogPhotoSrc("croissant-handle-mug"),
        color: "#eee3cf",
        accent: "#9d5d2d",
        caption: copy("همان دسته، رنگ دیگر", "The same handle, another colour"),
      },
      {
        id: "hand",
        src: "/making/RAD-M-1405-17/cleaned.png",
        color: "#ead9bd",
        accent: "#9d5d2d",
        caption: copy("دست همان کجی را تکرار کرد", "The hand repeated the lean"),
      },
      {
        id: "material",
        src: "/making/RAD-M-1405-17/glaze-tile.png",
        color: "#cbb892",
        accent: "#9d5d2d",
        caption: copy("لعاب غلیظ‌تر خزید", "The thicker glaze crawled"),
      },
      {
        id: "rad",
        src: catalogPhotoSrc("croissant-handle-mug", 1),
        color: "#eee3cf",
        accent: "#9d5d2d",
        caption: copy("آزمایش رنگ", "Colour trial"),
      },
    ],
  },
  {
    code: "041",
    slug: "homesickness-bowl",
    differenceId: "homesickness-bowl",
    familyId: "kiln",
    traits: { crooked: 0.4, quiet: 0.8, worn: 0.7, surprise: 0.85, strange: 0.55 },
    category: "ceramics",
    name: copy("کاسه دلتنگی", "Homesickness Bowl"),
    maker: copy("نیلوفر نادری", "Niloufar Naderi"),
    dateCreated: copy("فروردین ۱۴۰۵", "March 2026"),
    clay: copy("بتن خاک رس شمیران، دسته ۱۴۰۵-۰۳", "Shemiran stoneware, batch 1405-03"),
    glaze: copy("خاکستر گردو و اکسید آهن", "Walnut ash and iron oxide"),
    dimensions: copy("دهانه ۱۸ سانتی‌متر، ارتفاع ۷ سانتی‌متر", "18 cm rim, 7 cm high"),
    firing: copy("احیا، ۱۲۲۸ درجه، خنک‌سازی آهسته", "Reduction, 1228°C, slow cool"),
    inspiration: copy(
      "کاسه‌ای که حس خانه‌ای را داشته باشد که دیگر آنجا نیست؛ گرم، کمی نامتقارن.",
      "A bowl that feels like a house that is no longer there: warm, slightly off-balance.",
    ),
    firstSketch: {
      src: "/difference/homesickness-bowl/described-v3.jpg",
      note: copy("توصیف اول، پیش از گل", "The first description, before clay"),
    },
    construction: [
      {
        src: "/difference/homesickness-bowl/artist-v3.jpg",
        note: copy("بازخوانی دست روی چرخ", "The hand rereading the form on the wheel"),
      },
      {
        src: "/making/RAD-M-1405-17/glaze-tile.png",
        note: copy("نمونه خزیدن لعاب", "Glaze-crawl test"),
      },
    ],
    unexpectedChanges: copy(
      "لعاب در آتش به سمت زیتونی خزید و کوره یک شکست رنگی روی شانه گذاشت.",
      "The glaze drifted toward olive, and the kiln left a colour break on the shoulder.",
    ),
    finalPhotos: [
      {
        src: "/difference/homesickness-bowl/material-v3.jpg",
        note: copy("پس از آتش", "After the fire"),
      },
    ],
    owner: copy("صاحب اول", "The first keeper"),
    city: copy("اصفهان", "Isfahan"),
    care: copy(
      "دست‌شوی. برای غذا مناسب است. لبه نازک را به سینک نزنید.",
      "Hand wash. Food safe. Keep the thinned lip away from the sink edge.",
    ),
    sold: true,
    whereabouts: {
      current: copy("اصفهان → طاقچه آشپزخانه", "Isfahan → a kitchen ledge"),
      trail: [
        {
          place: copy("کارگاه رَد", "RAD workshop"),
          note: copy("از توصیف تا آتش", "From description to fire"),
        },
        {
          place: copy("اصفهان", "Isfahan"),
          note: copy("حالا اینجاست", "It lives here now"),
        },
      ],
    },
    beforeRad: framesFromPortrait("homesickness-bowl"),
  },
  {
    code: "044",
    slug: "tehran-alley-vase",
    differenceId: "tehran-alley-vase",
    familyId: "kiln",
    inspiredBy: "041",
    inspiredNote: copy("شکست رنگ کوره، مسیر دیگری شد", "A kiln colour-break became another path"),
    traits: { crooked: 0.2, quiet: 0.75, worn: 0.65, surprise: 0.6, strange: 0.5 },
    category: "ceramics",
    name: copy("گلدان کوچه", "Alley Vase"),
    maker: copy("سامان کریمی", "Saman Karimi"),
    dateCreated: copy("خرداد ۱۴۰۵", "May 2026"),
    clay: copy("مخلوط رس و ماسه رودخانه کرج", "Clay mixed with Karaj river sand"),
    glaze: copy("مات کربنی، پوشش ناقص تعمدی", "Carbon matte, deliberately incomplete cover"),
    dimensions: copy("ارتفاع ۲۲ سانتی‌متر", "22 cm high"),
    firing: copy("اکسید، ۱۱۸۰ درجه", "Oxidation, 1180°C"),
    inspiration: copy(
      "کوچه‌ای فراموش‌شده در تهران؛ باریک، سایه‌دار، با نوری که فقط ظهر می‌رسد.",
      "A forgotten Tehran alley: narrow, shadowed, with light that arrives only at noon.",
    ),
    firstSketch: {
      src: "/difference/tehran-alley-vase/described.png",
      note: copy("یادداشت کوچه، پیش از گل", "Alley note, before clay"),
    },
    construction: [
      {
        src: "/difference/tehran-alley-vase/artist.png",
        note: copy("فرورفتگی عمودی برای نور ظهر", "A vertical recess for noon light"),
      },
    ],
    unexpectedChanges: copy(
      "خط افقی دست روی بدنه ماند و سایه لعاب عمیق‌تر از طرح درآمد.",
      "A horizontal hand-line remained, and the matte shadow came out deeper than the drawing.",
    ),
    finalPhotos: [
      {
        src: "/difference/tehran-alley-vase/material.png",
        note: copy("فرم تمام‌شده", "The finished form"),
      },
    ],
    owner: copy("در استودیو رَد", "At the RAD studio"),
    city: copy("تهران", "Tehran"),
    care: copy(
      "سطح مات را با اسفنج نرم پاک کنید. آب زیاد روی قاعده نماند.",
      "Wipe the matte surface with a soft sponge. Do not leave water on the foot.",
    ),
    sold: false,
    whereabouts: {
      current: copy("تهران → قفسه کارگاه", "Tehran → the workshop shelf"),
      trail: [
        {
          place: copy("کارگاه رَد", "RAD workshop"),
          note: copy("هنوز اینجاست", "It is still here"),
        },
      ],
    },
    beforeRad: framesFromPortrait("tehran-alley-vase"),
  },
  {
    code: "052",
    slug: "quiet-cloth",
    differenceId: "quiet-cloth",
    category: "textile",
    name: copy("پارچه آرام", "Quiet Cloth"),
    maker: copy("مهتاب رضوی", "Mahtab Razavi"),
    dateCreated: copy("تیر ۱۴۰۵", "June 2026"),
    clay: copy("پشم دست‌ریس مازندران", "Hand-spun Mazandaran wool"),
    glaze: copy("رنگرزی پوست انار و روناس", "Pomegranate rind and madder dye"),
    dimensions: copy("۸۴ در ۶۲ سانتی‌متر", "84 × 62 cm"),
    firing: copy("ثبوت با بخار، نه آتش", "Steam-set, not fired"),
    inspiration: copy(
      "پارچه‌ای که سکوت یک اتاق را نگه دارد، نه طرح را.",
      "A cloth that would hold the quiet of a room, not a pattern.",
    ),
    firstSketch: {
      src: "/difference/quiet-cloth/described.png",
      note: copy("نقشه اولیه بافت", "The first weave map"),
    },
    construction: [
      {
        src: "/difference/quiet-cloth/artist.png",
        note: copy("جابه‌جایی تراکم پود", "A shift in weft density"),
      },
    ],
    unexpectedChanges: copy(
      "رنگ گیاهی در شست‌وشوی اول یک درجه خاکستری‌تر شد. همان را نگه داشتیم.",
      "The plant dye greyed one step in the first wash. We kept it.",
    ),
    finalPhotos: [
      {
        src: "/difference/quiet-cloth/material.png",
        note: copy("پارچه تمام‌شده", "The finished cloth"),
      },
    ],
    owner: copy("در استودیو رَد", "At the RAD studio"),
    city: copy("تهران", "Tehran"),
    care: copy(
      "شست‌وشوی سرد و خواباندن صاف. اتو از پشت، حرارت کم.",
      "Cold wash and dry flat. Iron on the reverse, low heat.",
    ),
    sold: false,
    whereabouts: {
      current: copy("تهران → دیوار کارگاه", "Tehran → the workshop wall"),
      trail: [
        {
          place: copy("کارگاه رَد", "RAD workshop"),
          note: copy("آویزان است تا دیده شود", "Hung so it can be seen"),
        },
      ],
    },
    beforeRad: framesFromPortrait("quiet-cloth"),
  },
];

function framesFromPortrait(id: string): BeforeRadFrame[] {
  const portrait = museumPortraits.find((item) => item.id === id);
  const images = portrait?.stageImages;
  const palette = portrait?.palette;
  return [
    {
      id: "idea",
      src: images?.described,
      color: palette?.described.color ?? "#cbb892",
      accent: palette?.described.accent ?? "#8a4938",
      caption: portrait?.described ?? copy("ایده", "Idea"),
    },
    {
      id: "hand",
      src: images?.artist,
      color: palette?.artist.color ?? "#87382c",
      accent: palette?.artist.accent ?? "#d8c4a0",
      caption: portrait?.artistNotes[0] ?? copy("دست", "Hand"),
    },
    {
      id: "material",
      src: images?.imagined,
      color: palette?.imagined.color ?? "#9f4030",
      accent: palette?.imagined.accent ?? "#ead9bd",
      caption: portrait?.imaginedNote ?? copy("ماده", "Material"),
    },
    {
      id: "rad",
      src: images?.material,
      color: palette?.material.color ?? "#4b513c",
      accent: palette?.material.accent ?? "#dbc7a5",
      caption: portrait?.materialNotes[0] ?? copy("رَد", "RAD"),
    },
  ];
}

const featuredCodes = new Set(featured.map((item) => item.code));
const featuredSlugs = new Set(
  featured.flatMap((item) => [item.productSlug, item.slug].filter(Boolean) as string[]),
);

function fromProduct(product: Product): RadPassport | null {
  const code = productCode(product);
  if (!code || code === "000" || featuredCodes.has(code) || featuredSlugs.has(product.slug)) {
    return null;
  }
  const available = product.status !== "sold";
  const image = product.images?.[0]?.src;
  const second = product.images?.[1]?.src;
  return {
    code,
    slug: product.slug,
    productSlug: product.slug,
    category: product.category,
    name: copy(product.name, product.en.name),
    maker: copy(
      product.vendor?.displayName ?? "استودیو رَد",
      product.vendor?.displayNameEn ?? "RAD Studio",
    ),
    dateCreated: copy("۱۴۰۵", "2026"),
    clay: copy(product.details[1] ?? product.details[0], product.en.details[1] ?? product.en.details[0]),
    glaze: copy(product.subtitle, product.en.subtitle),
    dimensions: copy(product.details[0], product.en.details[0]),
    firing: copy("پخت استودیو رَد، تهران", "RAD studio firing, Tehran"),
    inspiration: copy(product.story, product.en.story),
    construction: image
      ? [{ src: image, note: copy("در کارگاه", "In the workshop") }]
      : [],
    unexpectedChanges: copy(
      "اختلاف‌های کوچک سطح و لبه همان‌طور که از آتش درآمدند باقی ماندند.",
      "Small shifts in surface and rim were left as they came from the fire.",
    ),
    finalPhotos: [
      ...(image ? [{ src: image, note: copy("نماى اول", "First view") }] : []),
      ...(second ? [{ src: second, note: copy("نماى دوم", "Second view") }] : []),
    ],
    owner: available
      ? copy("هنوز در استودیو", "Still in the studio")
      : copy("صاحب اول", "The first keeper"),
    city: copy("تهران", "Tehran"),
    care: copy(
      "با دست بشویید. از شوک حرارتی و ماشین ظرفشویی دور بماند.",
      "Hand wash. Keep away from thermal shock and the dishwasher.",
    ),
    traits: { crooked: 0.35, quiet: 0.5, worn: 0.4, surprise: 0.45, strange: 0.35 },
    sold: !available,
    whereabouts: {
      current: available
        ? copy("تهران → قفسه کارگاه", "Tehran → the workshop shelf")
        : copy("تهران → خانه‌ی صاحب اول", "Tehran → the first keeper's home"),
      trail: [
        {
          place: copy("کارگاه رَد", "RAD workshop"),
          note: available
            ? copy("منتظر رفتن است", "Waiting to leave")
            : copy("از اینجا رفت", "It left from here"),
        },
      ],
    },
    beforeRad: [
      {
        id: "idea",
        color: product.accent,
        accent: product.color,
        caption: copy(product.story, product.en.story),
      },
      {
        id: "hand",
        src: image,
        color: product.color,
        accent: product.accent,
        caption: copy("دست فرم را گذاشت", "The hand set the form"),
      },
      {
        id: "material",
        src: second ?? image,
        color: product.color,
        accent: product.accent,
        caption: copy("ماده مسیر خودش را رفت", "The material took its own path"),
      },
      {
        id: "rad",
        src: image,
        color: product.color,
        accent: product.accent,
        caption: copy(product.name, product.en.name),
      },
    ],
  };
}

export const radPassports: RadPassport[] = [
  ...featured,
  ...photoWorks.map(fromProduct).filter((item): item is RadPassport => Boolean(item)),
].sort((a, b) => Number(a.code) - Number(b.code));

export function findPassport(param: string) {
  const raw = decodeURIComponent(param).trim();
  const code = padCode(raw);
  return (
    radPassports.find((item) => item.code === code) ??
    radPassports.find(
      (item) => item.slug === raw || item.productSlug === raw || item.differenceId === raw,
    )
  );
}

export function passportForProduct(product: Pick<Product, "slug" | "artworkNumber">) {
  return (
    radPassports.find((item) => item.productSlug === product.slug) ??
    findPassport(product.artworkNumber || "")
  );
}

export function formatPassportName(
  passport: RadPassport,
  locale: "fa" | "en",
  number: (value: number) => string,
) {
  const digits = number(Number(passport.code)).padStart(3, locale === "fa" ? "۰" : "0");
  const title = passport.name[locale];
  return locale === "fa" ? `رَد ${digits} — ${title}` : `RAD ${digits} — ${title}`;
}

export function formatPassportCode(
  code: string,
  locale: "fa" | "en",
  number: (value: number) => string,
) {
  return number(Number(code)).padStart(3, locale === "fa" ? "۰" : "0");
}
