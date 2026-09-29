import type { ArtworkRecord } from "./type";
import { t } from "./copy";

const making = (file: string) => `/making/RAD-M-1405-17/${file}`;
const difference = (id: string, file: string) => `/difference/${id}/${file}`;
const catalogPhoto = (file: string) => `/catalog/photos/transparent/${file}`;

/** Works with an editorial passport or difference record. Numbers are permanent. */
export const archiveArtworks: ArtworkRecord[] = [
  {
    radNumber: 7,
    slug: "croissant-handle-mug",
    artistId: "artist-sahar",
    category: "ceramics",
    initialStatus: "available",
    price: 2_800_000,
    usdPrice: 33,
    year: 2026,
    title: t("کج‌دسته", "Crooked Handle"),
    description: t(
      "لعاب شکلاتی و دسته پیکره‌وار",
      "Chocolate drip glaze and sculptural handle",
    ),
    story: t(
      "دسته‌ای که نباید صاف می‌نشست. یک کروسان مانده روی میز کارگاه، و میل به اینکه شیء روزمره کمی منحرف باشد.",
      "A handle that refused to sit straight. A leftover croissant on the bench, and the wish that an everyday object would lean.",
    ),
    dimensions: t(
      "ارتفاع ۹ سانتی‌متر، دهانه ۸ سانتی‌متر",
      "9 cm high, 8 cm rim",
    ),
    materials: {
      body: t(
        "استون‌ور شمیران، دسته ۱۴۰۵-۰۲",
        "Shemiran stoneware, batch 1405-02",
      ),
      surface: t(
        "شیر خام و شکلاتی روان",
        "Raw cream body, flowing chocolate glaze",
      ),
      process: t(
        "اکسید، ۱۱۸۴ درجه، خنک‌سازی آهسته",
        "Oxidation, 1184°C, slow cool",
      ),
    },
    care: t(
      "فقط دست‌شوی، آب ولرم، بدون شوک حرارتی. دسته را از بدنه نگیرید؛ از کمر ظرف بلند کنید.",
      "Hand wash only, lukewarm water, no thermal shock. Lift from the body, not the handle.",
    ),
    color: "#eee3cf",
    accent: "#9d5d2d",
    shape: "round",
    images: [
      {
        src: catalogPhoto("croissant-handle-mug.webp"),
        alt: "کج‌دسته پس از کوره، نور کارگاه",
        enAlt: "Crooked Handle after the kiln, workshop light",
      },
      {
        src: catalogPhoto("croissant-handle-mug-2.webp"),
        alt: "نمای دوم کج‌دسته؛ نوشته روی بدنه",
        enAlt: "Crooked Handle, second view with lettering on the body",
      },
    ],
    owner: null,
    difference: null,
    passport: {
      dateCreated: t("اردیبهشت ۱۴۰۵", "April 2026"),
      city: t("تهران", "Tehran"),
      firstSketch: {
        src: making("forming.webp"),
        note: t(
          "اولین فرم روی چرخ؛ دسته هنوز جدا بود.",
          "First form on the wheel; the handle was still separate.",
        ),
      },
      construction: [
        {
          src: making("forming.webp"),
          note: t(
            "بدنه پیش از اتصال دسته",
            "Body before the handle was joined",
          ),
        },
        {
          src: making("cleaned.webp"),
          note: t("تراش و پاک‌کردن درز دسته", "Cleaning the handle join"),
        },
        {
          src: making("glaze-tile.webp"),
          note: t(
            "نمونه لعاب شکلاتی روی تایل",
            "Chocolate glaze test on a tile",
          ),
        },
      ],
      unexpectedChanges: t(
        "در کوره دسته کمی بیشتر خم شد. آن را برنگرداندیم. کجی همان چیزی است که این رَد را رَد کرد.",
        "In the kiln the handle bent a little further. We left it. That lean is what made this RAD a RAD.",
      ),
      inspiredBy: 17,
      inspiredNote: t("الهام از همان کجی", "Inspired by that same lean"),
      traits: {
        crooked: 0.95,
        quiet: 0.35,
        worn: 0.7,
        surprise: 0.8,
        strange: 0.85,
      },
      marks: [
        {
          x: 78,
          y: 42,
          title: t("دسته", "Handle"),
          note: t(
            "این قسمت کمی پایین‌تر آمده. هنگام خشک‌شدن فرم خودش را تغییر داده. درستش نکردیم.",
            "This part sat a little lower. The form shifted while drying. We did not correct it.",
          ),
        },
        {
          x: 36,
          y: 28,
          title: t("لبه", "Rim"),
          note: t("اینجا لعاب جمع شده.", "The glaze gathered here."),
        },
        {
          x: 52,
          y: 68,
          title: t("بدنه", "Body"),
          note: t(
            "اثر انگشت سازنده اینجا مانده.",
            "The maker's fingerprint is still here.",
          ),
        },
      ],
      whereabouts: {
        current: t("تهران → قفسه کارگاه", "Tehran → the workshop shelf"),
        trail: [
          {
            place: t("کارگاه رَد", "RAD workshop"),
            note: t("شکل گرفت و پخته شد", "Formed and fired"),
          },
          {
            place: t("قفسه آرشیو", "Archive shelf"),
            note: t("شماره ۰۰۷ نشست", "Number 007 was given"),
          },
        ],
      },
      beforeRad: [
        {
          id: "idea",
          src: making("forming.webp"),
          color: "#eee3cf",
          accent: "#9d5d2d",
          caption: t(
            "کروسان روی میز؛ میل به دستهٔ کج",
            "A croissant on the bench; the wish for a crooked handle",
          ),
        },
        {
          id: "hand",
          src: making("cleaned.webp"),
          color: "#ead9bd",
          accent: "#8a4938",
          caption: t(
            "دست دسته را جایی گذاشت که صاف نبود",
            "The hand set the handle where it would not sit straight",
          ),
        },
        {
          id: "material",
          src: making("glaze-tile.webp"),
          color: "#cbb892",
          accent: "#9d5d2d",
          caption: t("لعاب از لبه سرازیر شد", "The glaze ran from the rim"),
        },
        {
          id: "rad",
          src: catalogPhoto("croissant-handle-mug.webp"),
          color: "#eee3cf",
          accent: "#9d5d2d",
          caption: t("آنچه از کوره بیرون آمد", "What came out of the kiln"),
        },
      ],
    },
  },
  {
    radNumber: 17,
    slug: "kaj-dasteh-first",
    artistId: "artist-sahar",
    category: "ceramics",
    initialStatus: "archived",
    price: null,
    usdPrice: null,
    year: 2026,
    title: t("کج‌دستهٔ اول", "First Crooked Handle"),
    description: t(
      "استون‌ور شیری، بی‌لعاب شکلاتی",
      "Cream stoneware, no chocolate glaze",
    ),
    story: t(
      "اولین باری که دسته اجازه یافت کج بنشیند.",
      "The first time a handle was allowed to sit crooked.",
    ),
    dimensions: t("ارتفاع ۸ سانتی‌متر", "8 cm high"),
    materials: {
      body: t("استون‌ور شمیران", "Shemiran stoneware"),
      surface: t("شیر خام، بدون شکلات", "Raw cream, no chocolate"),
      process: t("اکسید، ۱۱۸۰ درجه", "Oxidation, 1180°C"),
    },
    care: t("با دست بشویید.", "Hand wash."),
    color: "#eee3cf",
    accent: "#8a4938",
    shape: "round",
    images: [
      {
        src: making("cleaned.webp"),
        alt: "کج‌دستهٔ اول پس از تراش",
        enAlt: "First Crooked Handle after cleaning",
      },
    ],
    owner: null,
    difference: null,
    passport: {
      dateCreated: t("اسفند ۱۴۰۴", "March 2026"),
      city: t("تهران", "Tehran"),
      construction: [
        { src: making("forming.webp"), note: t("اولین فرم", "The first form") },
      ],
      unexpectedChanges: t(
        "دسته در خشک شدن خم شد. همان را نگه داشتیم.",
        "The handle bent while drying. We kept it.",
      ),
      traits: {
        crooked: 0.9,
        quiet: 0.5,
        worn: 0.6,
        surprise: 0.55,
        strange: 0.7,
      },
      whereabouts: {
        current: t("تهران → آرشیو کارگاه", "Tehran → the workshop archive"),
        trail: [
          {
            place: t("آرشیو رَد", "RAD archive"),
            note: t("نگاه داشته می‌شود", "It is kept"),
          },
        ],
      },
      beforeRad: [
        {
          id: "idea",
          src: making("forming.webp"),
          color: "#eee3cf",
          accent: "#8a4938",
          caption: t("میل به کجی", "The wish to lean"),
        },
        {
          id: "hand",
          src: making("cleaned.webp"),
          color: "#ead9bd",
          accent: "#8a4938",
          caption: t("دست دسته را رها کرد", "The hand let the handle go"),
        },
        {
          id: "material",
          src: making("cleaned.webp"),
          color: "#cbb892",
          accent: "#8a4938",
          caption: t("خشک شدن مسیر را عوض کرد", "Drying changed the path"),
        },
        {
          id: "rad",
          src: making("cleaned.webp"),
          color: "#eee3cf",
          accent: "#8a4938",
          caption: t("کج‌دستهٔ اول", "The first crooked handle"),
        },
      ],
    },
  },
  {
    radNumber: 29,
    slug: "haleh",
    artistId: "artist-niloofar",
    category: "ceramics",
    initialStatus: "sold",
    price: null,
    usdPrice: null,
    year: 2026,
    title: t("هاله", "Halo"),
    description: t(
      "کاسه‌ای با هالهٔ زیتونی روی کرم",
      "A bowl with an olive halo on cream",
    ),
    story: t(
      "نوری که دور یک شیء می‌ماند، نه خودِ شیء.",
      "The light that stays around an object, not the object itself.",
    ),
    dimensions: t("دهانه ۱۶ سانتی‌متر", "16 cm rim"),
    materials: {
      body: t("استون‌ور شمیران", "Shemiran stoneware"),
      surface: t("هالهٔ زیتونی روی کرم", "An olive halo on cream"),
      process: t("احیا، ۱۲۲۰ درجه", "Reduction, 1220°C"),
    },
    care: t(
      "با دست بشویید. لبه نازک را نزنید.",
      "Hand wash. Do not knock the thinned lip.",
    ),
    color: "#cbb892",
    accent: "#4b513c",
    shape: "round",
    images: [
      {
        src: difference("homesickness-bowl", "material-v2.webp"),
        alt: "هاله بعد از آتش",
        enAlt: "Halo after the fire",
      },
    ],
    owner: t("سارا", "Sara"),
    difference: null,
    passport: {
      dateCreated: t("اردیبهشت ۱۴۰۵", "April 2026"),
      city: t("تهران", "Tehran"),
      construction: [
        {
          src: difference("homesickness-bowl", "artist-v2.webp"),
          note: t("فرم پیش از هاله", "The form before the halo"),
        },
      ],
      unexpectedChanges: t(
        "هاله در کوره یک انگشت پهن‌تر شد.",
        "In the kiln the halo widened by a finger.",
      ),
      traits: {
        crooked: 0.25,
        quiet: 0.85,
        worn: 0.45,
        surprise: 0.75,
        strange: 0.4,
      },
      whereabouts: {
        current: t("تهران → مجموعه‌ی سارا", "Tehran → Sara's collection"),
        trail: [
          {
            place: t("کارگاه رَد", "RAD workshop"),
            note: t("شکل گرفت و پخته شد", "Formed and fired"),
          },
          {
            place: t("خانه‌ی سارا", "Sara's home"),
            note: t("روی قفسهٔ سارا", "On Sara's shelf"),
          },
        ],
      },
      beforeRad: [
        {
          id: "idea",
          color: "#cbb892",
          accent: "#4b513c",
          caption: t(
            "نوری که دور شیء می‌ماند",
            "The light that stays around an object",
          ),
        },
        {
          id: "hand",
          src: difference("homesickness-bowl", "artist-v2.webp"),
          color: "#87382c",
          accent: "#d8c4a0",
          caption: t(
            "دست فرم را پیش از هاله بست",
            "The hand closed the form before the halo",
          ),
        },
        {
          id: "material",
          color: "#9f4030",
          accent: "#ead9bd",
          caption: t("هاله در کوره پهن‌تر شد", "The halo widened in the kiln"),
        },
        {
          id: "rad",
          src: difference("homesickness-bowl", "material-v2.webp"),
          color: "#4b513c",
          accent: "#dbc7a5",
          caption: t("هاله", "Halo"),
        },
      ],
    },
  },
  {
    radNumber: 31,
    slug: "kaj-dasteh-colour",
    artistId: "artist-sahar",
    category: "ceramics",
    initialStatus: "archived",
    price: null,
    usdPrice: null,
    year: 2026,
    title: t("کج‌دستهٔ آزمایش رنگ", "Crooked Handle, colour trial"),
    description: t(
      "همان دسته با لعاب شکلاتی غلیظ‌تر",
      "The same handle in a thicker chocolate glaze",
    ),
    story: t(
      "اگر همان دسته را با لعاب دیگری بسوزانیم چه می‌شود؟",
      "What if the same handle was fired with another glaze?",
    ),
    dimensions: t("ارتفاع ۹ سانتی‌متر", "9 cm high"),
    materials: {
      body: t("استون‌ور شمیران", "Shemiran stoneware"),
      surface: t(
        "شکلاتی غلیظ‌تر، خزیدن بیشتر",
        "Thicker chocolate, more crawl",
      ),
      process: t("اکسید، ۱۱۸۸ درجه", "Oxidation, 1188°C"),
    },
    care: t("با دست بشویید.", "Hand wash."),
    color: "#eee3cf",
    accent: "#9d5d2d",
    shape: "round",
    images: [
      {
        src: making("glaze-tile.webp"),
        alt: "نسخه آزمایش رنگ",
        enAlt: "The colour-trial version",
      },
    ],
    owner: null,
    difference: null,
    passport: {
      dateCreated: t("خرداد ۱۴۰۵", "May 2026"),
      city: t("تهران", "Tehran"),
      construction: [
        { src: making("glaze-tile.webp"), note: t("نمونه رنگ", "Colour test") },
      ],
      unexpectedChanges: t(
        "لعاب از دسته پایین آمد و یک خط تیره ساخت.",
        "The glaze ran off the handle and left a dark line.",
      ),
      inspiredBy: 7,
      inspiredNote: t(
        "آزمایش رنگ روی همان دسته",
        "A colour experiment on the same handle",
      ),
      traits: {
        crooked: 0.88,
        quiet: 0.3,
        worn: 0.75,
        surprise: 0.9,
        strange: 0.8,
      },
      whereabouts: {
        current: t("تهران → آرشیو کارگاه", "Tehran → the workshop archive"),
        trail: [
          {
            place: t("آرشیو رَد", "RAD archive"),
            note: t("نگاه داشته می‌شود", "It is kept"),
          },
        ],
      },
      beforeRad: [
        {
          id: "idea",
          src: catalogPhoto("croissant-handle-mug.webp"),
          color: "#eee3cf",
          accent: "#9d5d2d",
          caption: t("همان دسته، رنگ دیگر", "The same handle, another colour"),
        },
        {
          id: "hand",
          src: making("cleaned.webp"),
          color: "#ead9bd",
          accent: "#9d5d2d",
          caption: t("دست همان کجی را تکرار کرد", "The hand repeated the lean"),
        },
        {
          id: "material",
          src: making("glaze-tile.webp"),
          color: "#cbb892",
          accent: "#9d5d2d",
          caption: t("لعاب غلیظ‌تر خزید", "The thicker glaze crawled"),
        },
        {
          id: "rad",
          src: making("glaze-tile.webp"),
          color: "#eee3cf",
          accent: "#9d5d2d",
          caption: t("آزمایش رنگ", "Colour trial"),
        },
      ],
    },
  },
  {
    radNumber: 41,
    slug: "homesickness-bowl",
    artistId: "artist-niloofar",
    category: "ceramics",
    initialStatus: "sold",
    price: null,
    usdPrice: null,
    year: 2026,
    title: t("کاسه دلتنگی", "Homesickness Bowl"),
    description: t(
      "کاسهٔ کمی نامتقارن با لعاب خاکستر گردو",
      "A slightly off-balance bowl in walnut-ash glaze",
    ),
    story: t(
      "کاسه‌ای که حس دلتنگی را داشته باشد؛ گرم، کمی نامتقارن، شبیه خانه‌ای که دیگر آنجا نیست.",
      "A bowl that feels like homesickness: warm, slightly off-balance, like a house that is no longer there.",
    ),
    dimensions: t(
      "دهانه ۱۸ سانتی‌متر، ارتفاع ۷ سانتی‌متر",
      "18 cm rim, 7 cm high",
    ),
    materials: {
      body: t(
        "استون‌ور شمیران، دسته ۱۴۰۵-۰۳",
        "Shemiran stoneware, batch 1405-03",
      ),
      surface: t(
        "خاکستر گردو و اکسید آهن، خزیدن افقی",
        "Walnut ash and iron oxide, lateral crawl",
      ),
      process: t(
        "احیا، ۱۲۲۸ درجه، خنک‌سازی آهسته",
        "Reduction, 1228°C, slow cool",
      ),
    },
    care: t(
      "با دست بشویید. برای غذا مناسب است. لبه نازک را به سینک نزنید.",
      "Hand wash. Food safe. Keep the thinned lip away from the sink edge.",
    ),
    color: "#4b513c",
    accent: "#dbc7a5",
    shape: "round",
    images: [
      {
        src: difference("homesickness-bowl", "material-v3.webp"),
        alt: "کاسه دلتنگی پس از آتش",
        enAlt: "Homesickness Bowl after the fire",
      },
    ],
    owner: t("صاحب اول", "The first keeper"),
    passport: {
      dateCreated: t("فروردین ۱۴۰۵", "March 2026"),
      city: t("اصفهان", "Isfahan"),
      firstSketch: {
        src: difference("homesickness-bowl", "described-v3.webp"),
        note: t("توصیف اول، پیش از گل", "The first description, before clay"),
      },
      construction: [
        {
          src: difference("homesickness-bowl", "artist-v3.webp"),
          note: t(
            "بازخوانی دست روی چرخ",
            "The hand rereading the form on the wheel",
          ),
        },
        {
          src: making("glaze-tile.webp"),
          note: t("نمونه خزیدن لعاب", "Glaze-crawl test"),
        },
      ],
      unexpectedChanges: t(
        "لعاب در آتش به سمت زیتونی خزید و کوره یک شکست رنگی روی شانه گذاشت.",
        "The glaze drifted toward olive, and the kiln left a colour break on the shoulder.",
      ),
      traits: {
        crooked: 0.4,
        quiet: 0.8,
        worn: 0.7,
        surprise: 0.85,
        strange: 0.55,
      },
      whereabouts: {
        current: t("اصفهان → طاقچه آشپزخانه", "Isfahan → a kitchen ledge"),
        trail: [
          {
            place: t("کارگاه رَد", "RAD workshop"),
            note: t("از توصیف تا آتش", "From description to fire"),
          },
          {
            place: t("اصفهان", "Isfahan"),
            note: t("حالا اینجاست", "It lives here now"),
          },
        ],
      },
    },
    difference: {
      permission: "material",
      imaginedNote: t(
        "هوش مصنوعی دهانه‌ای کاملاً گرد و لعابی یکدست مسی پیشنهاد کرد.",
        "AI proposed a perfectly round rim and an even copper glaze.",
      ),
      artistNotes: [
        t(
          "منحنی دهانه را برای تعادل کمی جمع کردم.",
          "I tightened this curve at the rim for balance.",
        ),
        t(
          "دیواره را نازک‌تر گذاشتم تا وزن مثل خاطره سبک بماند.",
          "I thinned the wall so the weight would feel like a memory, not a vessel.",
        ),
      ],
      materialNotes: [
        t(
          "لعاب در آتش به سمت زیتونی خزید.",
          "The glaze drifted toward olive in the fire.",
        ),
        t(
          "کوره یک شکست رنگی غیرمنتظره روی شانه ساخت.",
          "The kiln left an unexpected colour break on the shoulder.",
        ),
      ],
      irregularity: t(
        "لبه نازک و یک قطره لعاب خشک‌شده",
        "Thinned lip and one dried glaze tear",
      ),
      palette: {
        described: { color: "#cbb892", accent: "#8a4938" },
        imagined: { color: "#9f4030", accent: "#ead9bd" },
        artist: { color: "#87382c", accent: "#d8c4a0" },
        material: { color: "#4b513c", accent: "#dbc7a5" },
      },
      stageImages: {
        described: difference("homesickness-bowl", "described-v3.webp"),
        imagined: difference("homesickness-bowl", "imagined-v3.webp"),
        artist: difference("homesickness-bowl", "artist-v3.webp"),
        material: difference("homesickness-bowl", "material-v3.webp"),
      },
    },
  },
  {
    radNumber: 44,
    slug: "tehran-alley-vase",
    artistId: "artist-saman",
    category: "ceramics",
    initialStatus: "ready",
    price: null,
    usdPrice: null,
    year: 2026,
    title: t("گلدان کوچه", "Alley Vase"),
    description: t("گلدان باریک با مات کربنی", "A narrow vase in carbon matte"),
    story: t(
      "گلدانی شکل‌گرفته از یک کوچه فراموش‌شده تهران؛ باریک، سایه‌دار، با نوری که فقط ظهر می‌رسد.",
      "A vase shaped by a forgotten Tehran alley: narrow, shadowed, with light that arrives only at noon.",
    ),
    dimensions: t("ارتفاع ۲۲ سانتی‌متر", "22 cm high"),
    materials: {
      body: t(
        "مخلوط رس و ماسه رودخانه کرج",
        "Clay mixed with Karaj river sand",
      ),
      surface: t(
        "مات کربنی، پوشش ناقص تعمدی",
        "Carbon matte, deliberately incomplete cover",
      ),
      process: t("اکسید، ۱۱۸۰ درجه", "Oxidation, 1180°C"),
    },
    care: t(
      "سطح مات را با اسفنج نرم پاک کنید. آب زیاد روی قاعده نماند.",
      "Wipe the matte surface with a soft sponge. Do not leave water on the foot.",
    ),
    color: "#18231f",
    accent: "#8a4938",
    shape: "tall",
    images: [
      {
        src: difference("tehran-alley-vase", "material.webp"),
        alt: "گلدان کوچه، فرم تمام‌شده",
        enAlt: "Alley Vase, the finished form",
      },
    ],
    owner: null,
    passport: {
      dateCreated: t("خرداد ۱۴۰۵", "May 2026"),
      city: t("تهران", "Tehran"),
      firstSketch: {
        src: difference("tehran-alley-vase", "described.webp"),
        note: t("یادداشت کوچه، پیش از گل", "Alley note, before clay"),
      },
      construction: [
        {
          src: difference("tehran-alley-vase", "artist.webp"),
          note: t(
            "فرورفتگی عمودی برای نور ظهر",
            "A vertical recess for noon light",
          ),
        },
      ],
      unexpectedChanges: t(
        "خط افقی دست روی بدنه ماند و سایه لعاب عمیق‌تر از طرح درآمد.",
        "A horizontal hand-line remained, and the matte shadow came out deeper than the drawing.",
      ),
      inspiredBy: 41,
      inspiredNote: t(
        "شکست رنگ کوره، مسیر دیگری شد",
        "A kiln colour-break became another path",
      ),
      traits: {
        crooked: 0.2,
        quiet: 0.75,
        worn: 0.65,
        surprise: 0.6,
        strange: 0.5,
      },
      whereabouts: {
        current: t("تهران → قفسه کارگاه", "Tehran → the workshop shelf"),
        trail: [
          {
            place: t("کارگاه رَد", "RAD workshop"),
            note: t("هنوز اینجاست", "It is still here"),
          },
        ],
      },
    },
    difference: {
      permission: "hand",
      imaginedNote: t(
        "تصویر اولیه فرمی مجسمه‌وار و متقارن با سایه‌های گرافیکی ساخت.",
        "The first image made a sculptural, symmetrical form with graphic shadows.",
      ),
      artistNotes: [
        t(
          "ارتفاع را کوتاه کردم تا شبیه فاصله دو دیوار کوچه شود، نه یک بنای یادمانی.",
          "I shortened the height so it would feel like the space between two walls, not a monument.",
        ),
        t(
          "یک فرورفتگی عمودی گذاشتم؛ جای نوری که فقط ظهر می‌رسد.",
          "I cut a vertical recess—the place where noon light would fall.",
        ),
      ],
      materialNotes: [
        t(
          "خاک رس روی شانه دانه‌درشت ماند.",
          "The clay kept a coarse grain on the shoulder.",
        ),
        t(
          "سایه لعاب مات عمیق‌تر از طرح درآمد.",
          "The matte glaze shadow came out deeper than the drawing.",
        ),
      ],
      irregularity: t(
        "خط افقی دست روی بدنه باقی ماند",
        "A horizontal hand-line remains on the body",
      ),
      palette: {
        described: { color: "#d6cfc3", accent: "#263d34" },
        imagined: { color: "#31534a", accent: "#d87855" },
        artist: { color: "#243e35", accent: "#cbb892" },
        material: { color: "#18231f", accent: "#8a4938" },
      },
      stageImages: {
        described: difference("tehran-alley-vase", "described.webp"),
        imagined: difference("tehran-alley-vase", "imagined.webp"),
        artist: difference("tehran-alley-vase", "artist.webp"),
        material: difference("tehran-alley-vase", "material.webp"),
      },
    },
  },
  {
    radNumber: 52,
    slug: "quiet-cloth",
    artistId: "artist-mahtab",
    category: "textile",
    initialStatus: "ready",
    price: null,
    usdPrice: null,
    year: 2026,
    title: t("پارچه آرام", "Quiet Cloth"),
    description: t(
      "دیوارکوب پشمی با رنگ گیاهی",
      "A wool wall hanging in plant dye",
    ),
    story: t(
      "دیوارکوبی آرام با خطوط آزاد خاکی که بشود هر روز به آن نگاه کرد.",
      "A quiet wall hanging with free earth lines, something one could look at every day.",
    ),
    dimensions: t("۸۴ در ۶۲ سانتی‌متر", "84 × 62 cm"),
    materials: {
      body: t("پشم دست‌ریس مازندران", "Hand-spun Mazandaran wool"),
      surface: t("رنگرزی پوست انار و روناس", "Pomegranate rind and madder dye"),
      process: t("ثبوت با بخار، دو روز", "Steam-set over two days"),
    },
    care: t(
      "شست‌وشوی سرد و خواباندن صاف. اتو از پشت، حرارت کم.",
      "Cold wash and dry flat. Iron on the reverse, low heat.",
    ),
    color: "#76523b",
    accent: "#ead9bd",
    shape: "wide",
    images: [
      {
        src: difference("quiet-cloth", "material.webp"),
        alt: "پارچه آرام، تمام‌شده",
        enAlt: "Quiet Cloth, finished",
      },
    ],
    owner: null,
    passport: {
      dateCreated: t("تیر ۱۴۰۵", "June 2026"),
      city: t("تهران", "Tehran"),
      firstSketch: {
        src: difference("quiet-cloth", "described.webp"),
        note: t("نقشه اولیه بافت", "The first weave map"),
      },
      construction: [
        {
          src: difference("quiet-cloth", "artist.webp"),
          note: t("جابه‌جایی تراکم پود", "A shift in weft density"),
        },
      ],
      unexpectedChanges: t(
        "رنگ گیاهی روی پشم کمی به زرد متمایل شد. همان را نگه داشتیم.",
        "The plant dye on wool drifted slightly toward yellow. We kept it.",
      ),
      whereabouts: {
        current: t("تهران → دیوار کارگاه", "Tehran → the workshop wall"),
        trail: [
          {
            place: t("کارگاه رَد", "RAD workshop"),
            note: t("آویزان است تا دیده شود", "Hung so it can be seen"),
          },
        ],
      },
    },
    difference: {
      permission: "faithful",
      imaginedNote: t(
        "هوش مصنوعی شبکه‌ای منظم از خطوط متقاطع پیشنهاد کرد.",
        "AI suggested a regular lattice of crossing lines.",
      ),
      artistNotes: [
        t(
          "خطوط را از هم باز کردم تا چشم جایی برای ماندن داشته باشد.",
          "I opened the lines so the eye would have somewhere to rest.",
        ),
      ],
      materialNotes: [
        t(
          "رنگ گیاهی روی پشم کمی به زرد متمایل شد.",
          "The plant dye on wool drifted slightly toward yellow.",
        ),
      ],
      irregularity: t(
        "یک گره شل در حاشیه پایین",
        "One loosened knot on the lower edge",
      ),
      palette: {
        described: { color: "#e9d7b9", accent: "#b86449" },
        imagined: { color: "#b86449", accent: "#e9d7b9" },
        artist: { color: "#8a4938", accent: "#cbb892" },
        material: { color: "#76523b", accent: "#ead9bd" },
      },
      stageImages: {
        described: difference("quiet-cloth", "described.webp"),
        imagined: difference("quiet-cloth", "imagined.webp"),
        artist: difference("quiet-cloth", "artist.webp"),
        material: difference("quiet-cloth", "material.webp"),
      },
    },
  },
];
