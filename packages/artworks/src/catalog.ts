import type { ArtworkRecord } from "./type";
import { t } from "./copy";

/**
 * Production catalog snapshot from GET https://api.rad-object.com/products,
 * refreshed 2026-11-07. Hidden/archived products are intentionally excluded.
 * Keep this fallback and the E2E fixture slugs aligned with public production inventory.
 */
export const catalogArtworks: ArtworkRecord[] = [
  {
    radNumber: 34,
    slug: "mint-angular-cup",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 1200000,
    usdPrice: 14,
    year: null,
    title: t("ماگ رَنگو", "Mint Angular Cup"),
    description: t("فرم ارگانیک", "Organic marbled form"),
    story: t("رنگو | یه ماگ با چندتا شخصیت!🎨\n\nرنگو انگار موقع ساخته شدن نتونسته تصمیم بگیره چه رنگی باشه! یه‌جاش آبیه، یه‌جاش سبز، یه‌کم خاکی و تازه وقتی توشو نگاه می‌کنی، صورتی هم هست!\n\nنه خیلی صاف و صوفه، نه دنبال قرینه بودنه. با اون فرم نامنظم و دسته‌ی عجیب‌وغریبش، دقیقاً همون‌جوری شده که باید می‌شده.\n\nرنگو با دست ساخته شده و فقط یه دونه ازش توی دنیا هست.\n\nمثل همه‌ی رَد ها، رَنگو ام لنگه نداره.", "An asymmetric cup in marbled mint and sky-blue glaze with an integrated handle—organic and one of one."),
    dimensions: t("ظرفیت ۲۸۰ میلی‌لیتر", "280 ml capacity"),
    materials: {
      body: t("سرامیک لعاب‌دار", "Glazed ceramic"),
      surface: null,
      process: null,
    },
    care: null,
    color: "#b8d4c8",
    accent: "#8ec4d4",
    shape: "round",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/products/m03buwivhqlwks5qbctsirgs/acbb01ff7d2d418dcd97068c387bc1b7",
        "alt": "ماگ رَنگو",
        "enAlt": "ماگ رَنگو",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/products/m03buwivhqlwks5qbctsirgs/acbb01ff7d2d418dcd97068c387bc1b7"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/products/m03buwivhqlwks5qbctsirgs/bf1c0ba2b84cd095885fe19ce1e07c1c",
        "alt": "ماگ رَنگو",
        "enAlt": "ماگ رَنگو",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/products/m03buwivhqlwks5qbctsirgs/bf1c0ba2b84cd095885fe19ce1e07c1c"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/products/m03buwivhqlwks5qbctsirgs/3f0801d84b23d93f1fd1f8fc482d1464",
        "alt": "ماگ رَنگو",
        "enAlt": "ماگ رَنگو",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/products/m03buwivhqlwks5qbctsirgs/3f0801d84b23d93f1fd1f8fc482d1464"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/products/m03buwivhqlwks5qbctsirgs/63233ce2c11b7b8fdf6959f54f45ec5f",
        "alt": "ماگ رَنگو",
        "enAlt": "ماگ رَنگو",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/products/m03buwivhqlwks5qbctsirgs/63233ce2c11b7b8fdf6959f54f45ec5f"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 35,
    slug: "orange-boat-sculpture",
    artistId: "rad-studio",
    category: "sculpture",
    initialStatus: "sold",
    price: 3600000,
    usdPrice: 42,
    year: null,
    title: t("آباژور لَنگرِشب", "Orange Boat Sculpture"),
    description: t("سبک folk art", "Folk-art style"),
    story: t("قایق سرامیکی با شخصیت، پرندگان و دودکش نارنجی؛ می‌تواند گلدان کوچک یا آبجکت تزئینی باشد.\nبرای وقت هایی که خانه فقط با یک نور آرام میشود.", "A ceramic tugboat with a figure, birds, and an orange smokestack—small vase or decorative object."),
    dimensions: t("طول ۲۶ سانتی‌متر", "26 cm long"),
    materials: {
      body: t("سرامیک لعاب‌دار", "Glazed ceramic"),
      surface: null,
      process: null,
    },
    care: null,
    color: "#e87830",
    accent: "#f0e8dc",
    shape: "wide",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/products/ookiksuzmgot1mlb13tukdkx/22d21753f61231cd0c75d7001d8bc5cf",
        "alt": "آباژور لَنگرِشب",
        "enAlt": "آباژور لَنگرِشب",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/products/ookiksuzmgot1mlb13tukdkx/22d21753f61231cd0c75d7001d8bc5cf"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/products/ookiksuzmgot1mlb13tukdkx/fd4d97e30ebefd7ef73f1ad3751371f2",
        "alt": "آباژور لَنگرِشب",
        "enAlt": "آباژور لَنگرِشب",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/products/ookiksuzmgot1mlb13tukdkx/fd4d97e30ebefd7ef73f1ad3751371f2"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 39,
    slug: "speckled-sculpted-mug",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 900000,
    usdPrice: 11,
    year: null,
    title: t("ماگ گِردالو", "Speckled Sculpted Mug"),
    description: t("بافت شیاردار", "Fluted pumpkin form"),
    story: t("یه ماگ تپل‌مپل، با کلی خال‌خال ریز و یه دسته‌ی گنده که انگار برای بغل کردن ساخته شده! 🫶🏻\nبا دست ساخته شده، یه‌کم نامنظمه و فقط یه دونه ازش توی دنیا هست.\nمثل همه‌ی رَدها، گردالو هم لنگه نداره. 🤎", "A pumpkin-shaped mug with vertical ridges, cream speckled glaze, and a slightly irregular rim—wabi-sabi character."),
    dimensions: t("ظرفیت ۳۵۰ میلی‌لیتر", "350 ml capacity"),
    materials: {
      body: t("سرامیک لعاب‌دار", "Glazed ceramic"),
      surface: null,
      process: null,
    },
    care: null,
    color: "#e8dcc8",
    accent: "#2a2a2a",
    shape: "round",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/products/mun8kwksggcurcyxeec9vv3p/7e069e35088d3396c6dc82f996f4a8da",
        "alt": "ماگ گِردالو",
        "enAlt": "ماگ گِردالو",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/products/mun8kwksggcurcyxeec9vv3p/7e069e35088d3396c6dc82f996f4a8da"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/products/mun8kwksggcurcyxeec9vv3p/de079d51e960ffb93e891ec95f4c54ba",
        "alt": "ماگ گِردالو",
        "enAlt": "ماگ گِردالو",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/products/mun8kwksggcurcyxeec9vv3p/de079d51e960ffb93e891ec95f4c54ba"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 42,
    slug: "pink-petal-cup",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 2400000,
    usdPrice: 28,
    year: null,
    title: t("فنجان گلبرگ صورتی", "Pink Petal Cup"),
    description: t("فرم گلبرگی و دسته زیتونی", "Petal form with an olive handle"),
    story: t("فنجانی دست‌ساخت با دیواره‌هایی شبیه گلبرگ و دسته حلقه‌ای زیتونی؛ تفاوت‌های ظریف سطح، رد انگشت و قلم را نگه داشته‌اند.", "A hand-built cup with petal-like walls and an olive loop handle; subtle surface variations preserve the touch of hand and brush."),
    dimensions: t("ظرفیت تقریبی ۲۵۰ میلی‌لیتر", "Approximately 250 ml"),
    materials: {
      body: t("سرامیک لعاب‌دار", "Glazed ceramic"),
      surface: null,
      process: null,
    },
    care: null,
    color: "#eab9b6",
    accent: "#68723c",
    shape: "round",
    images: [
      {
        "src": "https://api.rad-object.com/catalog/images/frlmkmibzpor5rgvcgnbn3wg",
        "alt": "فنجان گلبرگ صورتی با دسته زیتونی",
        "enAlt": "Pink Petal Cup with olive loop handle",
        "kind": "image"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 58,
    slug: "dachshund-sculpture",
    artistId: "rad-studio",
    category: "sculpture",
    initialStatus: "available",
    price: 1200000,
    usdPrice: 14,
    year: null,
    title: t("مجسمه گوش دِراز", "Dachshund Sculpture"),
    description: t("سفال سیاه و سفید", "Black and white ceramic"),
    story: t("گوش‌دراز | یه سگ با اندازه‌های غیرمعمول! 🐶\n\nگوش‌دراز یه سگ کوچولوعه که انگار موقع ساخته شدن، یکی یادش رفته بهش بگه «دیگه بسه، انقدر دراز نشو!» 😂\n\nبا اون گوش‌های آویزون، پاهای فسقلی، خال‌های سیاه و لبخند ریزی که همیشه رو صورتشه، انگار از این قیافه‌ی عجیب‌وغریبش حسابی راضیه!\n\nنه عجله‌ای برای جایی رفتن داره، نه قصد داره شبیه بقیه‌ی سگ‌ها باشه.\n\nمثل همه‌ی رَدها، گوش‌دراز هم لنگه نداره. 🤎", "A minimalist dachshund figurine with a white body, black ears, and irregular spots—playful and calming."),
    dimensions: t("طول ۲۲ سانتی‌متر", "22 cm long"),
    materials: {
      body: t("سرامیک لعاب‌دار", "Glazed ceramic"),
      surface: null,
      process: null,
    },
    care: null,
    color: "#f5f0e8",
    accent: "#1a1a1a",
    shape: "wide",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/products/x7a294tqoxoji166ofy1rqq9/4b7004e4e7ecb02d7870a3cc5c931aab",
        "alt": "مجسمه گوش دِراز",
        "enAlt": "مجسمه گوش دِراز",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/products/x7a294tqoxoji166ofy1rqq9/4b7004e4e7ecb02d7870a3cc5c931aab"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/products/x7a294tqoxoji166ofy1rqq9/3b33a6697f88b14f0164806b62d7b81d",
        "alt": "مجسمه گوش دِراز",
        "enAlt": "مجسمه گوش دِراز",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/products/x7a294tqoxoji166ofy1rqq9/3b33a6697f88b14f0164806b62d7b81d"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/products/x7a294tqoxoji166ofy1rqq9/10ba40e43415f312bd91ea4a2fa971e5",
        "alt": "مجسمه گوش دِراز",
        "enAlt": "مجسمه گوش دِراز",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/products/x7a294tqoxoji166ofy1rqq9/10ba40e43415f312bd91ea4a2fa971e5"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 61,
    slug: "sharki",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 1400000,
    usdPrice: 16,
    year: null,
    title: t("شارکی", "شارکی"),
    description: t("خطرش در حديه قهوه ست.", "خطرش در حديه قهوه ست."),
    story: t("خطرش در حديه قهوه ست.", "خطرش در حديه قهوه ست."),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/3d47b2bb0808e24f86ddcd8a9fc3c9d1",
        "alt": "شارکی",
        "enAlt": "شارکی",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/3d47b2bb0808e24f86ddcd8a9fc3c9d1"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/2892cfcd491e8adc4dfc696ca68fad81",
        "alt": "شارکی",
        "enAlt": "شارکی",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/2892cfcd491e8adc4dfc696ca68fad81"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/a147d78128777218a616996349ba9c19",
        "alt": "شارکی",
        "enAlt": "شارکی",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/a147d78128777218a616996349ba9c19"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/3a008a82077fd94d8ec0b21a33a65ee5",
        "alt": "شارکی",
        "enAlt": "شارکی",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/3a008a82077fd94d8ec0b21a33a65ee5"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 62,
    slug: "behind-flower",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 4000000,
    usdPrice: 47,
    year: null,
    title: t("پشتِ گلها", "يشتِ گلها"),
    description: t("چشمها پنهان اند، اما حضورش نه.", "چشمها پنهان اند، اما حضورش نه."),
    story: t("چشمها پنهان اند، اما حضورش نه.", "چشمها پنهان اند، اما حضورش نه."),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/3f191f49c52d9c5d5456ad6dbb3306a8",
        "alt": "پشتِ گلها",
        "enAlt": "پشتِ گلها",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/3f191f49c52d9c5d5456ad6dbb3306a8"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/4468c4795cccab4d08d5a73d1f675354",
        "alt": "پشتِ گلها",
        "enAlt": "پشتِ گلها",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/4468c4795cccab4d08d5a73d1f675354"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/254c45072cb9bbf9a3b713b1032d1416",
        "alt": "پشتِ گلها",
        "enAlt": "پشتِ گلها",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/254c45072cb9bbf9a3b713b1032d1416"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/9cba6036b0210cf8d9600bca4328ca8e",
        "alt": "پشتِ گلها",
        "enAlt": "پشتِ گلها",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/9cba6036b0210cf8d9600bca4328ca8e"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 63,
    slug: "hale",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 4200000,
    usdPrice: 49,
    year: null,
    title: t("هاله", "هاله"),
    description: t("نور دور خودش میپیچد.", "نور دور خودش میپیچد."),
    story: t("نور دور خودش میپیچد.", "نور دور خودش میپیچد."),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/ecc4d309e07d3e9bd911d2ee245d715f",
        "alt": "هاله",
        "enAlt": "هاله",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/ecc4d309e07d3e9bd911d2ee245d715f"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/42c5b78bc9c34ab5b7e64bfeb1722bc8",
        "alt": "هاله",
        "enAlt": "هاله",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/42c5b78bc9c34ab5b7e64bfeb1722bc8"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/a85bf99aeca9738e986b9e211738f9fd",
        "alt": "هاله",
        "enAlt": "هاله",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/a85bf99aeca9738e986b9e211738f9fd"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/c291ee6621151a587d07e50febc4bd8e",
        "alt": "هاله",
        "enAlt": "هاله",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/c291ee6621151a587d07e50febc4bd8e"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/a1e373de616a20814e8c2b83aff34def",
        "alt": "هاله",
        "enAlt": "هاله",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/a1e373de616a20814e8c2b83aff34def"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/9140c8833ffc18e736c106827a0b0dec",
        "alt": "هاله",
        "enAlt": "هاله",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/9140c8833ffc18e736c106827a0b0dec"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/54f22d89b285e271dca649a1e59e1469",
        "alt": "هاله",
        "enAlt": "هاله",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/54f22d89b285e271dca649a1e59e1469"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 64,
    slug: "shrunken-mug",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 1100000,
    usdPrice: 13,
    year: null,
    title: t("ماگ آب رفته", "ماگ آب رفته"),
    description: t("آبی قرار نبود سرجاش بمونه.", "آبی قرار نبود سرجاش بمونه."),
    story: t("آبی قرار نبود سرجاش بمونه.", "آبی قرار نبود سرجاش بمونه."),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/06e6b2aedf797016e1c0bbe349b3b886",
        "alt": "ماگ آب رفته",
        "enAlt": "ماگ آب رفته",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/06e6b2aedf797016e1c0bbe349b3b886"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/2ee5c516aa83c6c6e6f0f99e78b48d59",
        "alt": "ماگ آب رفته",
        "enAlt": "ماگ آب رفته",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/2ee5c516aa83c6c6e6f0f99e78b48d59"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/6daf94f4008c871a8dab717c8ed64679",
        "alt": "ماگ آب رفته",
        "enAlt": "ماگ آب رفته",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/6daf94f4008c871a8dab717c8ed64679"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 65,
    slug: "val-valak",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 1300000,
    usdPrice: 15,
    year: null,
    title: t("وال والَک", "وال والَک"),
    description: t("🐋 وال‌والَک | یه تیکه از دریا، توی دستای تو! 🩵", "🐋 وال‌والَک | یه تیکه از دریا، توی دستای تو! 🩵"),
    story: t("🐋 وال‌والَک | یه تیکه از دریا، توی دستای تو! 🩵\n\nوال‌والَک از دریا اومده، ولی اون‌قدر کوچیکه که می‌شه با یه دست بغلش کرد!\n\nیه وال آبیِ خال‌خالی، با چشم‌های بسته و یه لبخند ریز که انگار هیچ غمی توی دنیا نداره.\n\nدُمش رو هم آورده بالا و دسته‌ی ماگ کرده، که هر وقت دلت برای دریا تنگ شد، بتونی یه چای بریزی و باهاش بری وسط موج‌ها! 🌊\n\nبا دست ساخته شده، یه‌کم بازیگوشه، یه‌کم خیال‌باف و همیشه انگار داره خواب دریا رو می‌بینه.\n\nمثل همه‌ی رَدها، وال‌والَک هم لنگه نداره. 🤎", "🐋 وال‌والَک | یه تیکه از دریا، توی دستای تو! 🩵\n\nوال‌والَک از دریا اومده، ولی اون‌قدر کوچیکه که می‌شه با یه دست بغلش کرد!\n\nیه وال آبیِ خال‌خالی، با چشم‌های بسته و یه لبخند ریز که انگار هیچ غمی توی دنیا نداره.\n\nدُمش رو هم آورده بالا و دسته‌ی ماگ کرده، که هر وقت دلت برای دریا تنگ شد، بتونی یه چای بریزی و باهاش بری وسط موج‌ها! 🌊\n\nبا دست ساخته شده، یه‌کم بازیگوشه، یه‌کم خیال‌باف و همیشه انگار داره خواب دریا رو می‌بینه.\n\nمثل همه‌ی رَدها، وال‌والَک هم لنگه نداره. 🤎"),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/a8e5ede9e0760e18c82809add45c897a",
        "alt": "وال والَک",
        "enAlt": "وال والَک",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/a8e5ede9e0760e18c82809add45c897a"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/92b96ce634444a49d24ea2d2a65b9898",
        "alt": "وال والَک",
        "enAlt": "وال والَک",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/92b96ce634444a49d24ea2d2a65b9898"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/89785db6a7d7ece40e13069b90e3958d",
        "alt": "وال والَک",
        "enAlt": "وال والَک",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/89785db6a7d7ece40e13069b90e3958d"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/682135963832bf048b4144cb04c99ca6",
        "alt": "وال والَک",
        "enAlt": "وال والَک",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/682135963832bf048b4144cb04c99ca6"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/eaefdf4bbc0b0d9df363cd8dc25469f2",
        "alt": "وال والَک",
        "enAlt": "وال والَک",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/eaefdf4bbc0b0d9df363cd8dc25469f2"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/fbfbceecec758973876ee1f9aba56c8f",
        "alt": "وال والَک",
        "enAlt": "وال والَک",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/fbfbceecec758973876ee1f9aba56c8f"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 66,
    slug: "arghavan",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 2500000,
    usdPrice: 29,
    year: null,
    title: t("اَرغوان", "اَرغوان"),
    description: t("ارغوان | یه ظرف با سلیقه‌ی خودش! 🩷\n\nارغوان از ا", "ارغوان | یه ظرف با سلیقه‌ی خودش! 🩷\n\nارغوان از ا"),
    story: t("ارغوان | یه ظرف با سلیقه‌ی خودش! 🩷\n\nارغوان از اوناییه که خیلی اهل ساده و بی‌سروصدا بودن نیست!\n\nیه‌جا صورتیه، یه‌جا کرم، یه عالمه خط سرمه‌ای هم دور خودش کشیده که انگار هرکدوم ساز خودشون رو می‌زنن.\n\nبا اون درِ سرمه‌ای و نقش‌های نامنظمش، یه‌کم شلوغه، یه‌کم جسور و حسابی خوش‌سلیقه!\n\nیه ظرف دردار برای نگه داشتن چیزای کوچیکی که دوستشون داری؛ از زیورآلات و یادگاری‌ها گرفته تا خوراکی‌هایی که دلت نمی‌خواد با کسی شریک بشی! 👀\n\nمثل همه‌ی رَدها، ارغوان هم لنگه نداره. 🤎", "ارغوان | یه ظرف با سلیقه‌ی خودش! 🩷\n\nارغوان از اوناییه که خیلی اهل ساده و بی‌سروصدا بودن نیست!\n\nیه‌جا صورتیه، یه‌جا کرم، یه عالمه خط سرمه‌ای هم دور خودش کشیده که انگار هرکدوم ساز خودشون رو می‌زنن.\n\nبا اون درِ سرمه‌ای و نقش‌های نامنظمش، یه‌کم شلوغه، یه‌کم جسور و حسابی خوش‌سلیقه!\n\nیه ظرف دردار برای نگه داشتن چیزای کوچیکی که دوستشون داری؛ از زیورآلات و یادگاری‌ها گرفته تا خوراکی‌هایی که دلت نمی‌خواد با کسی شریک بشی! 👀\n\nمثل همه‌ی رَدها، ارغوان هم لنگه نداره. 🤎"),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/d3525ef6db7917f45b5a662a8d0b0ff8",
        "alt": "اَرغوان",
        "enAlt": "اَرغوان",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/d3525ef6db7917f45b5a662a8d0b0ff8"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/6331f0f8f151e79a19f35236e7ce879a",
        "alt": "اَرغوان",
        "enAlt": "اَرغوان",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/6331f0f8f151e79a19f35236e7ce879a"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/feaf5168f1ee980e643a9f94e17b2b8d",
        "alt": "اَرغوان",
        "enAlt": "اَرغوان",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/feaf5168f1ee980e643a9f94e17b2b8d"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 67,
    slug: "malamit",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 1800000,
    usdPrice: 21,
    year: null,
    title: t("مالامیت", "مالامیت"),
    description: t("مالامیت | یه عالمه خط، بدون هیچ نقشه‌ای! 🌿\n\nمال", "مالامیت | یه عالمه خط، بدون هیچ نقشه‌ای! 🌿\n\nمال"),
    story: t("مالامیت | یه عالمه خط، بدون هیچ نقشه‌ای! 🌿\n\nمالامیت انگار یه تیکه از دل طبیعته که تصمیم گرفته به‌جای سنگ بودن، یه ظرف بشه!\n\nبا اون موج‌های سبز و کرم که دور تا دورش پیچیدن، شبیه لایه‌های یه سنگ قدیمیه که هر خطش یه مسیر متفاوت رو رفته.\n\nیه‌جا برجسته شده، یه‌جا فرو رفته و هیچ‌کدوم از خط‌هاش قرار نیست دقیقاً شبیه هم باشن.\n\nیه ظرف دردار برای نگه داشتن چیزای کوچیک و دوست‌داشتنی؛ از زیورآلات گرفته تا خرده‌ریزهایی که همیشه دنبال یه جا براشون می‌گردیم.\n\nمثل همه‌ی رَدها، مالامیت هم لنگه نداره. 🤎", "مالامیت | یه عالمه خط، بدون هیچ نقشه‌ای! 🌿\n\nمالامیت انگار یه تیکه از دل طبیعته که تصمیم گرفته به‌جای سنگ بودن، یه ظرف بشه!\n\nبا اون موج‌های سبز و کرم که دور تا دورش پیچیدن، شبیه لایه‌های یه سنگ قدیمیه که هر خطش یه مسیر متفاوت رو رفته.\n\nیه‌جا برجسته شده، یه‌جا فرو رفته و هیچ‌کدوم از خط‌هاش قرار نیست دقیقاً شبیه هم باشن.\n\nیه ظرف دردار برای نگه داشتن چیزای کوچیک و دوست‌داشتنی؛ از زیورآلات گرفته تا خرده‌ریزهایی که همیشه دنبال یه جا براشون می‌گردیم.\n\nمثل همه‌ی رَدها، مالامیت هم لنگه نداره. 🤎"),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/5b65b1b109388ea3e5c587b5f3d4a41b",
        "alt": "مالامیت",
        "enAlt": "مالامیت",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/5b65b1b109388ea3e5c587b5f3d4a41b"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/02e31874ae5d3dc996d3bfa308230b54",
        "alt": "مالامیت",
        "enAlt": "مالامیت",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/02e31874ae5d3dc996d3bfa308230b54"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/cf19766322f8389519b692c3ae7b3094",
        "alt": "مالامیت",
        "enAlt": "مالامیت",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/cf19766322f8389519b692c3ae7b3094"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/53026632cacefbe9e674cf3fd1d4d0d6",
        "alt": "مالامیت",
        "enAlt": "مالامیت",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/53026632cacefbe9e674cf3fd1d4d0d6"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 68,
    slug: "maava",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 2200000,
    usdPrice: 26,
    year: null,
    title: t("مأوا", "مأوا"),
    description: t("مأوا | یه جای کوچیک برای آرامش 🤍\n\nمأوا یعنی جای", "مأوا | یه جای کوچیک برای آرامش 🤍\n\nمأوا یعنی جای"),
    story: t("مأوا | یه جای کوچیک برای آرامش 🤍\n\nمأوا یعنی جایی برای پناه گرفتن، برای موندن، برای یه لحظه آروم بودن.\n\nیه فرم ساده و قوسی‌شکل، با یه فضای خالی بزرگ و یه ظرف کوچولو که درست وسطش جا خوش کرده.\n\nانگار همه‌ی این قوس و پیچ‌وخم ساخته شده تا یه جای امن برای اون کوچولوی وسط باشه!\n\nمأوا با دست ساخته شده؛ با لبه‌های نرم، فرم‌های کمی نامنظم و رنگی آروم که قرار نیست توی شلوغی‌ها گم بشه.\n\nمی‌تونه میزبان یه شاخه گل باشه، یه شمع کوچیک یا فقط خودش؛ بدون اینکه چیزی کم داشته باشه.\n\nمثل همه‌ی رَدها، مأوا هم لنگه نداره. 🤎", "مأوا | یه جای کوچیک برای آرامش 🤍\n\nمأوا یعنی جایی برای پناه گرفتن، برای موندن، برای یه لحظه آروم بودن.\n\nیه فرم ساده و قوسی‌شکل، با یه فضای خالی بزرگ و یه ظرف کوچولو که درست وسطش جا خوش کرده.\n\nانگار همه‌ی این قوس و پیچ‌وخم ساخته شده تا یه جای امن برای اون کوچولوی وسط باشه!\n\nمأوا با دست ساخته شده؛ با لبه‌های نرم، فرم‌های کمی نامنظم و رنگی آروم که قرار نیست توی شلوغی‌ها گم بشه.\n\nمی‌تونه میزبان یه شاخه گل باشه، یه شمع کوچیک یا فقط خودش؛ بدون اینکه چیزی کم داشته باشه.\n\nمثل همه‌ی رَدها، مأوا هم لنگه نداره. 🤎"),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/869f3760f9baa4b35041eede5bb7725b",
        "alt": "مأوا",
        "enAlt": "مأوا",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/869f3760f9baa4b35041eede5bb7725b"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/7e7216ca099bf656bca1e3b418b79932",
        "alt": "مأوا",
        "enAlt": "مأوا",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/7e7216ca099bf656bca1e3b418b79932"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/f55eb6971088095b8b854789f15885e3",
        "alt": "مأوا",
        "enAlt": "مأوا",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/f55eb6971088095b8b854789f15885e3"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/dc775661365290bf8b2a7b95833610a5",
        "alt": "مأوا",
        "enAlt": "مأوا",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/dc775661365290bf8b2a7b95833610a5"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 69,
    slug: "lime",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "sold",
    price: 950000,
    usdPrice: 11,
    year: null,
    title: t("لیمو تُرش", "لیمو تُرش"),
    description: t("🍋 لیموترش | یه بشقاب با طعم تابستون!\n\nلیموترش ا", "🍋 لیموترش | یه بشقاب با طعم تابستون!\n\nلیموترش ا"),
    story: t("🍋 لیموترش | یه بشقاب با طعم تابستون!\n\nلیموترش از اوناییه که حتی وقتی هیچی توش نیست، باز هم دل آدم رو می‌بره!\n\nیه عالمه لیموی زرد و آبدار، چندتا برگ سبز و گل‌های آبی کوچولو که لابه‌لاشون سرک کشیدن. 🌿🩵\n\nهمه‌شون با دست نقاشی شدن؛ نه لیموها دقیقاً شبیه همن، نه برگ‌ها قراره خیلی مرتب و منظم باشن.\n\nلیموترش شاید اسمش ترش باشه، ولی خودش حسابی شیرینه! 🍋\n\nمثل همه‌ی رَدها، لیموترش هم لنگه نداره. 🤎", "🍋 لیموترش | یه بشقاب با طعم تابستون!\n\nلیموترش از اوناییه که حتی وقتی هیچی توش نیست، باز هم دل آدم رو می‌بره!\n\nیه عالمه لیموی زرد و آبدار، چندتا برگ سبز و گل‌های آبی کوچولو که لابه‌لاشون سرک کشیدن. 🌿🩵\n\nهمه‌شون با دست نقاشی شدن؛ نه لیموها دقیقاً شبیه همن، نه برگ‌ها قراره خیلی مرتب و منظم باشن.\n\nلیموترش شاید اسمش ترش باشه، ولی خودش حسابی شیرینه! 🍋\n\nمثل همه‌ی رَدها، لیموترش هم لنگه نداره. 🤎"),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/29f78ea661d69de49ff10998a0246b10",
        "alt": "لیمو تُرش",
        "enAlt": "لیمو تُرش",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/29f78ea661d69de49ff10998a0246b10"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/4a1bdb88726b42d752363c517be88de5",
        "alt": "لیمو تُرش",
        "enAlt": "لیمو تُرش",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/4a1bdb88726b42d752363c517be88de5"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 70,
    slug: "labyrinth",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 1700000,
    usdPrice: 20,
    year: null,
    title: t("هِزارتو", "هِزارتو"),
    description: t("هزارتو | راهش را خودش پیدا می‌کند. 🖤💛\n\nهزارتو ", "هزارتو | راهش را خودش پیدا می‌کند. 🖤💛\n\nهزارتو "),
    story: t("هزارتو | راهش را خودش پیدا می‌کند. 🖤💛\n\nهزارتو از آن ظرف‌هایی‌ست که یک‌جا نمی‌ایستد؛\nچشم از هر طرف که رویش می‌چرخد، می‌رود میان خط‌ها، پیچ‌ها و شکل‌هایی که انگار هرکدام راه خودشان را دارند.\n\nزردِ تندش کنار مشکیِ براق، هزارتو را به چیزی بیشتر از یک پارچ تبدیل کرده؛\nیک شیء کاربردی با شخصیتی بلند، جسور و کمی سرکش.\n\nبرای آب، شربت، یا حتی فقط برای اینکه یک گوشه از خانه را از حالِ عادی‌اش دربیاورد.\n\nمثل همه‌ی رَدها، هزارتو هم لنگه نداره. 🤎", "هزارتو | راهش را خودش پیدا می‌کند. 🖤💛\n\nهزارتو از آن ظرف‌هایی‌ست که یک‌جا نمی‌ایستد؛\nچشم از هر طرف که رویش می‌چرخد، می‌رود میان خط‌ها، پیچ‌ها و شکل‌هایی که انگار هرکدام راه خودشان را دارند.\n\nزردِ تندش کنار مشکیِ براق، هزارتو را به چیزی بیشتر از یک پارچ تبدیل کرده؛\nیک شیء کاربردی با شخصیتی بلند، جسور و کمی سرکش.\n\nبرای آب، شربت، یا حتی فقط برای اینکه یک گوشه از خانه را از حالِ عادی‌اش دربیاورد.\n\nمثل همه‌ی رَدها، هزارتو هم لنگه نداره. 🤎"),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/bf99a278f16ebedbc88f4ee4d6475563",
        "alt": "هِزارتو",
        "enAlt": "هِزارتو",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/bf99a278f16ebedbc88f4ee4d6475563"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/5783731a1b55f31b72bd285960d910ae",
        "alt": "هِزارتو",
        "enAlt": "هِزارتو",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/5783731a1b55f31b72bd285960d910ae"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/69fc7c4b32768ac5219182b5782aa288",
        "alt": "هِزارتو",
        "enAlt": "هِزارتو",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/69fc7c4b32768ac5219182b5782aa288"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/95b5756ebcd9842d7add9f32f898bcbb",
        "alt": "هِزارتو",
        "enAlt": "هِزارتو",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/95b5756ebcd9842d7add9f32f898bcbb"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 71,
    slug: "ashkob",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 2300000,
    usdPrice: 27,
    year: null,
    title: t("اشکوب", "اشکوب"),
    description: t("اشکوب | هر چیزی جای خودش! 🩵\n\nاشکوب از اوناییه ک", "اشکوب | هر چیزی جای خودش! 🩵\n\nاشکوب از اوناییه ک"),
    story: t("اشکوب | هر چیزی جای خودش! 🩵\n\nاشکوب از اوناییه که دوست داره همه‌چیز رو توی طبقه‌ی خودش نگه داره!\n\nیه طبقه بالا، یه طبقه پایین و کلی جا برای چیزای کوچیک و دوست‌داشتنی.\n\nاز انگشتر و گوشواره گرفته تا شکلات و خوراکی‌های ریز، هر چیزی می‌تونه یه گوشه از اشکوب برای خودش جا پیدا کنه.\n\nبا اون لعاب آبیِ خال‌خالی و لبه‌هایی که رنگ گِل از زیرشون پیداست، قرار نیست فقط یه ظرف کاربردی باشه؛ خودش هم یه گوشه از خونه رو قشنگ‌تر می‌کنه.\n\nمثل همه‌ی رَدها، اشکوب هم لنگه نداره. 🤎", "اشکوب | هر چیزی جای خودش! 🩵\n\nاشکوب از اوناییه که دوست داره همه‌چیز رو توی طبقه‌ی خودش نگه داره!\n\nیه طبقه بالا، یه طبقه پایین و کلی جا برای چیزای کوچیک و دوست‌داشتنی.\n\nاز انگشتر و گوشواره گرفته تا شکلات و خوراکی‌های ریز، هر چیزی می‌تونه یه گوشه از اشکوب برای خودش جا پیدا کنه.\n\nبا اون لعاب آبیِ خال‌خالی و لبه‌هایی که رنگ گِل از زیرشون پیداست، قرار نیست فقط یه ظرف کاربردی باشه؛ خودش هم یه گوشه از خونه رو قشنگ‌تر می‌کنه.\n\nمثل همه‌ی رَدها، اشکوب هم لنگه نداره. 🤎"),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/cbe46f63cba416ec650859b3c0e49382",
        "alt": "اشکوب",
        "enAlt": "اشکوب",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/cbe46f63cba416ec650859b3c0e49382"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/1ec936f72019b7715d9c8b8e77c4dabc",
        "alt": "اشکوب",
        "enAlt": "اشکوب",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/1ec936f72019b7715d9c8b8e77c4dabc"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/25c37a1ff1dccaec6a8141d78c3f86c7",
        "alt": "اشکوب",
        "enAlt": "اشکوب",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/25c37a1ff1dccaec6a8141d78c3f86c7"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/0c90f17bc180e6d9e7421158fe88de95",
        "alt": "اشکوب",
        "enAlt": "اشکوب",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/0c90f17bc180e6d9e7421158fe88de95"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 72,
    slug: "mario",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 2100000,
    usdPrice: 25,
    year: null,
    title: t("قارچ خور", "قارچ خور"),
    description: t("🍄 قارچ‌خور | نگهبون خوشمزه‌ها! ❤️\n\nقارچ‌خور یه ", "🍄 قارچ‌خور | نگهبون خوشمزه‌ها! ❤️\n\nقارچ‌خور یه "),
    story: t("🍄 قارچ‌خور | نگهبون خوشمزه‌ها! ❤️\n\nقارچ‌خور یه ظرف قرمز و خوشحالِ پر از قارچ‌های ریز و درشته که یه علاقه‌ی عجیب به خوراکی‌ها داره!\n\nفرقی نمی‌کنه شکلات باشه، آب‌نبات یا یه مشت پاستیل؛ هرچی خوشمزه‌تر، بهتر! 🍬\n\nیه در هم داره که خوراکی‌هاتو از چشم بقیه قایم کنه، البته به شرطی که خودت زودتر سراغشون نری! 👀\n\nبا دست ساخته شده، پر از جزئیات کوچولوعه و حسابی دلش می‌خواد یه گوشه از خونه‌ات جا خوش کنه.\n\nمثل همه‌ی رَدها، قارچ‌خور هم لنگه نداره. 🤎", "🍄 قارچ‌خور | نگهبون خوشمزه‌ها! ❤️\n\nقارچ‌خور یه ظرف قرمز و خوشحالِ پر از قارچ‌های ریز و درشته که یه علاقه‌ی عجیب به خوراکی‌ها داره!\n\nفرقی نمی‌کنه شکلات باشه، آب‌نبات یا یه مشت پاستیل؛ هرچی خوشمزه‌تر، بهتر! 🍬\n\nیه در هم داره که خوراکی‌هاتو از چشم بقیه قایم کنه، البته به شرطی که خودت زودتر سراغشون نری! 👀\n\nبا دست ساخته شده، پر از جزئیات کوچولوعه و حسابی دلش می‌خواد یه گوشه از خونه‌ات جا خوش کنه.\n\nمثل همه‌ی رَدها، قارچ‌خور هم لنگه نداره. 🤎"),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/e1ef159c227d90a75008d0577f2e55ba",
        "alt": "قارچ خور",
        "enAlt": "قارچ خور",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/e1ef159c227d90a75008d0577f2e55ba"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/2d233e52f1f3a2377a31d113443a0c64",
        "alt": "قارچ خور",
        "enAlt": "قارچ خور",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/2d233e52f1f3a2377a31d113443a0c64"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/2bdedbe10a151bb5edce868d7035a3ce",
        "alt": "قارچ خور",
        "enAlt": "قارچ خور",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/2bdedbe10a151bb5edce868d7035a3ce"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 73,
    slug: "iwan",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 6300000,
    usdPrice: 74,
    year: null,
    title: t("اِیوان", "اِیوان"),
    description: t("ایوان | یه گوشه‌ی دنج برای چیزای دوست‌داشتنی! ☀️", "ایوان | یه گوشه‌ی دنج برای چیزای دوست‌داشتنی! ☀️"),
    story: t("ایوان | یه گوشه‌ی دنج برای چیزای دوست‌داشتنی! ☀️\n\nایوان از اوناییه که برای قشنگ بودن، لازم نیست خیلی شلوغش کنی!\n\nیه میز کوچیک با رنگ گرمِ عسلی، پایه‌ی خوش‌فرم و یه سطح گرد که انگار منتظره چیزای موردعلاقه‌ت رو روش بچینی. 🤎\n\nیه چراغ رومیزی، یه فنجون قهوه، کتابی که نصفه خوندیش یا حتی یه گلدون کوچیک؛ ایوان برای همه‌شون جا داره.\n\nبا دست ساخته شده، با انحناهای نرم و جزئیات کوچیکی که بهش شخصیت می‌دن.\n\nقرار نیست فقط یه میز باشه؛ قراره یه گوشه‌ی ساده از خونه رو به یکی از دوست‌داشتنی‌ترین گوشه‌هاش تبدیل کنه.\n\nمثل همه‌ی رَدها، ایوان هم لنگه نداره. 🤎", "ایوان | یه گوشه‌ی دنج برای چیزای دوست‌داشتنی! ☀️\n\nایوان از اوناییه که برای قشنگ بودن، لازم نیست خیلی شلوغش کنی!\n\nیه میز کوچیک با رنگ گرمِ عسلی، پایه‌ی خوش‌فرم و یه سطح گرد که انگار منتظره چیزای موردعلاقه‌ت رو روش بچینی. 🤎\n\nیه چراغ رومیزی، یه فنجون قهوه، کتابی که نصفه خوندیش یا حتی یه گلدون کوچیک؛ ایوان برای همه‌شون جا داره.\n\nبا دست ساخته شده، با انحناهای نرم و جزئیات کوچیکی که بهش شخصیت می‌دن.\n\nقرار نیست فقط یه میز باشه؛ قراره یه گوشه‌ی ساده از خونه رو به یکی از دوست‌داشتنی‌ترین گوشه‌هاش تبدیل کنه.\n\nمثل همه‌ی رَدها، ایوان هم لنگه نداره. 🤎"),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/06c75cde54911c3629d5d026be144d50",
        "alt": "اِیوان",
        "enAlt": "اِیوان",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/06c75cde54911c3629d5d026be144d50"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/d6860c9dc9ad7543d40a77e5ae64dac2",
        "alt": "اِیوان",
        "enAlt": "اِیوان",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/d6860c9dc9ad7543d40a77e5ae64dac2"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/02e043c0979b61c81a3bb822b58b2da2",
        "alt": "اِیوان",
        "enAlt": "اِیوان",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/02e043c0979b61c81a3bb822b58b2da2"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 74,
    slug: "karane",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 1200000,
    usdPrice: 14,
    year: null,
    title: t("ماگ کَرانه", "ماگ کَرانه"),
    description: t("کرانه | یه گوشه از آرامشِ دریا 🩵\n\nکرانه انگار ی", "کرانه | یه گوشه از آرامشِ دریا 🩵\n\nکرانه انگار ی"),
    story: t("کرانه | یه گوشه از آرامشِ دریا 🩵\n\nکرانه انگار یه تیکه از آسمون و دریاست که توی دستات جا گرفته!\n\nیه لیوان آبیِ خال‌خالی، با لبه‌های نامنظم و انحناهای کوچیکی که جای دست‌های سازنده‌ش رو به یادگار نگه داشتن.\n\nنه کاملاً صافه، نه قرار بوده بی‌نقص و قرینه باشه. درست مثل موج‌هایی که هیچ‌وقت دو بار به یه شکل به ساحل نمی‌رسن. 🌊\n\nبرای چای صبحگاهی کنار پنجره، قهوه‌ی عصر یا اون چند دقیقه‌ای که دلت می‌خواد از شلوغی روز فاصله بگیری.\n\nمثل همه‌ی رَدها، کرانه هم لنگه نداره. 🤎", "کرانه | یه گوشه از آرامشِ دریا 🩵\n\nکرانه انگار یه تیکه از آسمون و دریاست که توی دستات جا گرفته!\n\nیه لیوان آبیِ خال‌خالی، با لبه‌های نامنظم و انحناهای کوچیکی که جای دست‌های سازنده‌ش رو به یادگار نگه داشتن.\n\nنه کاملاً صافه، نه قرار بوده بی‌نقص و قرینه باشه. درست مثل موج‌هایی که هیچ‌وقت دو بار به یه شکل به ساحل نمی‌رسن. 🌊\n\nبرای چای صبحگاهی کنار پنجره، قهوه‌ی عصر یا اون چند دقیقه‌ای که دلت می‌خواد از شلوغی روز فاصله بگیری.\n\nمثل همه‌ی رَدها، کرانه هم لنگه نداره. 🤎"),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/d241f540cf95443e578116ba913f245d",
        "alt": "ماگ کَرانه",
        "enAlt": "ماگ کَرانه",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/d241f540cf95443e578116ba913f245d"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/84e1fa50dad2502ece9374bbf0482a10",
        "alt": "ماگ کَرانه",
        "enAlt": "ماگ کَرانه",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/84e1fa50dad2502ece9374bbf0482a10"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/4e4abbfcd96a54ab0e2fbac1fb9d7154",
        "alt": "ماگ کَرانه",
        "enAlt": "ماگ کَرانه",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/4e4abbfcd96a54ab0e2fbac1fb9d7154"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/2df99d77882369e1920dda4dc87ae9c0",
        "alt": "ماگ کَرانه",
        "enAlt": "ماگ کَرانه",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/2df99d77882369e1920dda4dc87ae9c0"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/a2ab8a6936766b1420647fa4ce4bacc8",
        "alt": "ماگ کَرانه",
        "enAlt": "ماگ کَرانه",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/a2ab8a6936766b1420647fa4ce4bacc8"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 75,
    slug: "toast-neshin",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 1400000,
    usdPrice: 16,
    year: null,
    title: t("تُست نشین", "تُست نشین"),
    description: t("🍞 تُست‌نشین | یه تخت برای گربه، یه جا برای گوشی", "🍞 تُست‌نشین | یه تخت برای گربه، یه جا برای گوشی"),
    story: t("🍞 تُست‌نشین | یه تخت برای گربه، یه جا برای گوشیت! 🐈\n\nتُست‌نشین یه گربه‌ی تنبله که از بین تمام جاهای دنیا، یه تیکه نون تُست رو برای لم دادن انتخاب کرده! 😂\n\nحالا هم اون‌قدر راحت خوابیده که انگار اجاره‌ی تخت رو خودش داده!\n\nولی تُست‌نشین فقط جای چرت زدن گربه نیست؛ یه جای مخصوص هم برای گوشی تو داره! 📱\n\nگوشیت رو بذار سر جاش، یه‌کم ازش فاصله بگیر و تو هم مثل این گربه‌ی بی‌خیال، چند دقیقه استراحت کن.\n\nهمه‌چیز با دست ساخته شده؛ از نون تُست نارنجی گرفته تا گربه‌ی سفیدی که هیچ عجله‌ای برای بیدار شدن نداره.\n\nمثل همه‌ی رَدها، تُست‌نشین هم لنگه نداره. 🤎", "🍞 تُست‌نشین | یه تخت برای گربه، یه جا برای گوشیت! 🐈\n\nتُست‌نشین یه گربه‌ی تنبله که از بین تمام جاهای دنیا، یه تیکه نون تُست رو برای لم دادن انتخاب کرده! 😂\n\nحالا هم اون‌قدر راحت خوابیده که انگار اجاره‌ی تخت رو خودش داده!\n\nولی تُست‌نشین فقط جای چرت زدن گربه نیست؛ یه جای مخصوص هم برای گوشی تو داره! 📱\n\nگوشیت رو بذار سر جاش، یه‌کم ازش فاصله بگیر و تو هم مثل این گربه‌ی بی‌خیال، چند دقیقه استراحت کن.\n\nهمه‌چیز با دست ساخته شده؛ از نون تُست نارنجی گرفته تا گربه‌ی سفیدی که هیچ عجله‌ای برای بیدار شدن نداره.\n\nمثل همه‌ی رَدها، تُست‌نشین هم لنگه نداره. 🤎"),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/1e8119192209689f558a87111e77a776",
        "alt": "تُست نشین",
        "enAlt": "تُست نشین",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/1e8119192209689f558a87111e77a776"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/2a2b5d2e4c15f41ef815040a94fec9ed",
        "alt": "تُست نشین",
        "enAlt": "تُست نشین",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/2a2b5d2e4c15f41ef815040a94fec9ed"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/54a6f7589021b6b62b92fc8326039407",
        "alt": "تُست نشین",
        "enAlt": "تُست نشین",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/54a6f7589021b6b62b92fc8326039407"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 76,
    slug: "capitano",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 1200000,
    usdPrice: 14,
    year: null,
    title: t("ماگ کاپیتانو", "ماگ کاپیتانو"),
    description: t("🐈‍⬛ کاپیتانو | یه گربه توی فنجون قهوه! ☕️\n\nکاپی", "🐈‍⬛ کاپیتانو | یه گربه توی فنجون قهوه! ☕️\n\nکاپی"),
    story: t("🐈‍⬛ کاپیتانو | یه گربه توی فنجون قهوه! ☕️\n\nکاپیتانو یه گربه‌ی سیاهِ چشم‌گرده که تصمیم گرفته به‌جای لم دادن روی مبل، روی یه فنجون قهوه جا خوش کنه!\n\nبا اون چشم‌های متعجب، گوش‌های تیز و دُم بلندی که دور خودش پیچیده و شده دسته‌ی فنجون، انگار همیشه یه چیزی برای کنجکاو شدن داره. 👀\n\nیه فنجون کوچیک و دست‌ساز، برای قهوه‌های خوش‌عطر و آدم‌هایی که یه‌کم گربه‌دوستن!\n\nمثل همه‌ی رَدها، کاپیتانو هم لنگه نداره. 🤎", "🐈‍⬛ کاپیتانو | یه گربه توی فنجون قهوه! ☕️\n\nکاپیتانو یه گربه‌ی سیاهِ چشم‌گرده که تصمیم گرفته به‌جای لم دادن روی مبل، روی یه فنجون قهوه جا خوش کنه!\n\nبا اون چشم‌های متعجب، گوش‌های تیز و دُم بلندی که دور خودش پیچیده و شده دسته‌ی فنجون، انگار همیشه یه چیزی برای کنجکاو شدن داره. 👀\n\nیه فنجون کوچیک و دست‌ساز، برای قهوه‌های خوش‌عطر و آدم‌هایی که یه‌کم گربه‌دوستن!\n\nمثل همه‌ی رَدها، کاپیتانو هم لنگه نداره. 🤎"),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/c2fcd1ba4d15c66d7193ee5782e1d80a",
        "alt": "ماگ کاپیتانو",
        "enAlt": "ماگ کاپیتانو",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/c2fcd1ba4d15c66d7193ee5782e1d80a"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/96421f36a5f9b1a6d8fa2b833ff1abb0",
        "alt": "ماگ کاپیتانو",
        "enAlt": "ماگ کاپیتانو",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/96421f36a5f9b1a6d8fa2b833ff1abb0"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/364ce9a9a7703f029d2ed45a0a107ecc",
        "alt": "ماگ کاپیتانو",
        "enAlt": "ماگ کاپیتانو",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/364ce9a9a7703f029d2ed45a0a107ecc"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 77,
    slug: "nilofar",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 2400000,
    usdPrice: 28,
    year: null,
    title: t("نیلوفر", "نیلوفر"),
    description: t("💙 نیلوفر | یه گل که تصمیم گرفت ظرف باشه!\n\nنیلوف", "💙 نیلوفر | یه گل که تصمیم گرفت ظرف باشه!\n\nنیلوف"),
    story: t("💙 نیلوفر | یه گل که تصمیم گرفت ظرف باشه!\n\nنیلوفر انگار از دل آب بیرون اومده، ولی به‌جای اینکه روی آب شناور بمونه، اومده روی میزت جا خوش کنه!\n\nبا اون لبه‌های پرپیچ‌وتاب که شبیه گلبرگ‌های بازشده‌ان و لعاب آبیِ عمیقی که انگار یه تیکه از دریا توش جا مونده. 🌊\n\nهیچ‌کدوم از گلبرگ‌هاش دقیقاً شبیه هم نیستن؛ یکی بالاتره، یکی پایین‌تر، یکی هم انگار دلش خواسته راه خودش رو بره!\n\nنیلوفر با دست ساخته شده؛ یه ظرف برای میوه، خوراکی‌های خوشمزه یا حتی فقط برای اینکه خودش وسط میز بدرخشه.\n\nمثل همه‌ی رَدها، نیلوفر هم لنگه نداره. 🤎", "💙 نیلوفر | یه گل که تصمیم گرفت ظرف باشه!\n\nنیلوفر انگار از دل آب بیرون اومده، ولی به‌جای اینکه روی آب شناور بمونه، اومده روی میزت جا خوش کنه!\n\nبا اون لبه‌های پرپیچ‌وتاب که شبیه گلبرگ‌های بازشده‌ان و لعاب آبیِ عمیقی که انگار یه تیکه از دریا توش جا مونده. 🌊\n\nهیچ‌کدوم از گلبرگ‌هاش دقیقاً شبیه هم نیستن؛ یکی بالاتره، یکی پایین‌تر، یکی هم انگار دلش خواسته راه خودش رو بره!\n\nنیلوفر با دست ساخته شده؛ یه ظرف برای میوه، خوراکی‌های خوشمزه یا حتی فقط برای اینکه خودش وسط میز بدرخشه.\n\nمثل همه‌ی رَدها، نیلوفر هم لنگه نداره. 🤎"),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/e45592f224ec8e4e0abbca8f7e3891ad",
        "alt": "نیلوفر",
        "enAlt": "نیلوفر",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/e45592f224ec8e4e0abbca8f7e3891ad"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/bd6a4a07c46df671e22d9ccf14d04feb",
        "alt": "نیلوفر",
        "enAlt": "نیلوفر",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/bd6a4a07c46df671e22d9ccf14d04feb"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 78,
    slug: "abi-bigharar",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 2500000,
    usdPrice: 29,
    year: null,
    title: t("آبیِ‌ بی‌قرار", "آبیِ‌ بی‌قرار"),
    description: t("💙 آبیِ بی‌قرار | یه موج که دلش نخواست آروم بگیر", "💙 آبیِ بی‌قرار | یه موج که دلش نخواست آروم بگیر"),
    story: t("💙 آبیِ بی‌قرار | یه موج که دلش نخواست آروم بگیره! 🌊\n\nآبیِ بی‌قرار انگار یه تیکه از دریاست که درست وسط موج زدن، تصمیم گرفته ظرف بشه!\n\nبا اون رنگ آبیِ عمیق، لعاب پر از نقش‌های ریز و لبه‌هایی که مدام بالا و پایین می‌رن، انگار هنوز یه‌کم از جنب‌وجوش دریا توی تنش مونده.\n\nدو تا دسته داره، ولی هیچ‌کدوم از پیچ‌وتاب‌های لبه‌هاش قرار نیست شبیه هم باشن.\n\nیه ظرف دست‌ساز برای میوه، شیرینی یا هر چیزی که دلت می‌خواد یه‌کم متفاوت‌تر سرو بشه.\n\nشاید اسمش بی‌قرار باشه، ولی روی میزت حسابی جا خوش می‌کنه! 🩵\n\nمثل همه‌ی رَدها، آبیِ بی‌قرار هم لنگه نداره. 🤎", "💙 آبیِ بی‌قرار | یه موج که دلش نخواست آروم بگیره! 🌊\n\nآبیِ بی‌قرار انگار یه تیکه از دریاست که درست وسط موج زدن، تصمیم گرفته ظرف بشه!\n\nبا اون رنگ آبیِ عمیق، لعاب پر از نقش‌های ریز و لبه‌هایی که مدام بالا و پایین می‌رن، انگار هنوز یه‌کم از جنب‌وجوش دریا توی تنش مونده.\n\nدو تا دسته داره، ولی هیچ‌کدوم از پیچ‌وتاب‌های لبه‌هاش قرار نیست شبیه هم باشن.\n\nیه ظرف دست‌ساز برای میوه، شیرینی یا هر چیزی که دلت می‌خواد یه‌کم متفاوت‌تر سرو بشه.\n\nشاید اسمش بی‌قرار باشه، ولی روی میزت حسابی جا خوش می‌کنه! 🩵\n\nمثل همه‌ی رَدها، آبیِ بی‌قرار هم لنگه نداره. 🤎"),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/d3275258e8b5ba8d97b30d74c9d7aaa5",
        "alt": "آبیِ‌ بی‌قرار",
        "enAlt": "آبیِ‌ بی‌قرار",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/d3275258e8b5ba8d97b30d74c9d7aaa5"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/9d3e60bfd2807aa8c746e3d47de2173e",
        "alt": "آبیِ‌ بی‌قرار",
        "enAlt": "آبیِ‌ بی‌قرار",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/9d3e60bfd2807aa8c746e3d47de2173e"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 79,
    slug: "apricot",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 750000,
    usdPrice: 9,
    year: null,
    title: t("اسپرسوخوری زردآلو", "اسپرسوخوری زردآلو"),
    description: t("🍑 زردآلو | یه شات کوچیک، با کلی شخصیت! ☕️\n\nزردآ", "🍑 زردآلو | یه شات کوچیک، با کلی شخصیت! ☕️\n\nزردآ"),
    story: t("🍑 زردآلو | یه شات کوچیک، با کلی شخصیت! ☕️\n\nزردآلو از اوناییه که با دیدنش ناخودآگاه لبخند می‌زنی!\n\nیه اسپرسوخوری زرد و آفتابی، با خط‌های آبی که از لبه‌هاش سرازیر شدن و یه دسته‌ی گرد و قلمبه که انگار یه زردآلوی کوچولو به بغلش چسبیده! 💛\n\nنه دسته‌ش شبیه فنجون‌های معمولیه، نه خط‌هاش خیلی اهل صاف و مرتب بودنن.\n\nزردآلو کوچیکه، ولی با اون رنگ و قیافه‌ی خاصش حسابی توی چشم میاد!\n\nبرای یه شات اسپرسوی تلخ، توی فنجونی که خودش حسابی شیرینه. 🍑\n\nمثل همه‌ی رَدها، زردآلو هم لنگه نداره. 🤎", "🍑 زردآلو | یه شات کوچیک، با کلی شخصیت! ☕️\n\nزردآلو از اوناییه که با دیدنش ناخودآگاه لبخند می‌زنی!\n\nیه اسپرسوخوری زرد و آفتابی، با خط‌های آبی که از لبه‌هاش سرازیر شدن و یه دسته‌ی گرد و قلمبه که انگار یه زردآلوی کوچولو به بغلش چسبیده! 💛\n\nنه دسته‌ش شبیه فنجون‌های معمولیه، نه خط‌هاش خیلی اهل صاف و مرتب بودنن.\n\nزردآلو کوچیکه، ولی با اون رنگ و قیافه‌ی خاصش حسابی توی چشم میاد!\n\nبرای یه شات اسپرسوی تلخ، توی فنجونی که خودش حسابی شیرینه. 🍑\n\nمثل همه‌ی رَدها، زردآلو هم لنگه نداره. 🤎"),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/3770cc24f7fe6234544a1554329a304d",
        "alt": "اسپرسوخوری زردآلو",
        "enAlt": "اسپرسوخوری زردآلو",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/3770cc24f7fe6234544a1554329a304d"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/d4deb2d1c51924c43cbbda8884dbe7ec",
        "alt": "اسپرسوخوری زردآلو",
        "enAlt": "اسپرسوخوری زردآلو",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/d4deb2d1c51924c43cbbda8884dbe7ec"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/e62873345b6de16f384e004764a3e55d",
        "alt": "اسپرسوخوری زردآلو",
        "enAlt": "اسپرسوخوری زردآلو",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/e62873345b6de16f384e004764a3e55d"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/9e43866b5e86c5d0f045f2a67143aedf",
        "alt": "اسپرسوخوری زردآلو",
        "enAlt": "اسپرسوخوری زردآلو",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/9e43866b5e86c5d0f045f2a67143aedf"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/be6acd0aec2e0ab9b05eed2eb0a9c28f",
        "alt": "اسپرسوخوری زردآلو",
        "enAlt": "اسپرسوخوری زردآلو",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/be6acd0aec2e0ab9b05eed2eb0a9c28f"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 80,
    slug: "flamingo",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 800000,
    usdPrice: 9,
    year: null,
    title: t("اسپرسوخوری فلامینگو", "فلامینگو"),
    description: t("🦩 فلامینگو | یه اسپرسو با ژست مخصوص! ☕️\n\nفلامین", "🦩 فلامینگو | یه اسپرسو با ژست مخصوص! ☕️\n\nفلامین"),
    story: t("🦩 فلامینگو | یه اسپرسو با ژست مخصوص! ☕️\n\nفلامینگو از اوناییه که حتی موقع قهوه خوردن هم دوست داره یه‌کم جلب توجه کنه!\n\nیه بدنه‌ی سرمه‌ایِ کشیده، یه دسته‌ی صورتی با یه سوراخ گرد وسطش و یه قیافه‌ی عجیب‌وغریب که انگار از یه سیاره‌ی دیگه اومده! 🩷\n\nنه دسته‌ش شبیه فنجون‌های معمولیه، نه خودش خیلی علاقه‌ای به معمولی بودن داره.\n\nکوچیکه، ولی حسابی برای خودش شخصیت داره؛ درست مثل یه فلامینگوی خوش‌تیپ که روی یه پا وایساده و داره با افتخار ژست می‌گیره!\n\nبرای یه شات اسپرسو و شروع روزی که قرار نیست خیلی معمولی باشه.\n\nمثل همه‌ی رَدها، فلامینگو هم لنگه نداره. 🤎", "🦩 فلامینگو | یه اسپرسو با ژست مخصوص! ☕️\n\nفلامینگو از اوناییه که حتی موقع قهوه خوردن هم دوست داره یه‌کم جلب توجه کنه!\n\nیه بدنه‌ی سرمه‌ایِ کشیده، یه دسته‌ی صورتی با یه سوراخ گرد وسطش و یه قیافه‌ی عجیب‌وغریب که انگار از یه سیاره‌ی دیگه اومده! 🩷\n\nنه دسته‌ش شبیه فنجون‌های معمولیه، نه خودش خیلی علاقه‌ای به معمولی بودن داره.\n\nکوچیکه، ولی حسابی برای خودش شخصیت داره؛ درست مثل یه فلامینگوی خوش‌تیپ که روی یه پا وایساده و داره با افتخار ژست می‌گیره!\n\nبرای یه شات اسپرسو و شروع روزی که قرار نیست خیلی معمولی باشه.\n\nمثل همه‌ی رَدها، فلامینگو هم لنگه نداره. 🤎"),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/c691a015b2fbc300357dffe1cf3ea5c6",
        "alt": "اسپرسوخوری فلامینگو",
        "enAlt": "اسپرسوخوری فلامینگو",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/c691a015b2fbc300357dffe1cf3ea5c6"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/f50503fc450f03476bb33e3aadd35110",
        "alt": "اسپرسوخوری فلامینگو",
        "enAlt": "اسپرسوخوری فلامینگو",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/f50503fc450f03476bb33e3aadd35110"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/3e9a2b20b6197b09aa894ea7c136b9e3",
        "alt": "اسپرسوخوری فلامینگو",
        "enAlt": "اسپرسوخوری فلامینگو",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/3e9a2b20b6197b09aa894ea7c136b9e3"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 81,
    slug: "chik-chikak",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 960000,
    usdPrice: 11,
    year: null,
    title: t("چیک چیکَک", "چیک چیکَک"),
    description: t("📸 چیک‌چیکَک | یه دوربین که بازنشسته شده! ❤️\n\nچی", "📸 چیک‌چیکَک | یه دوربین که بازنشسته شده! ❤️\n\nچی"),
    story: t("📸 چیک‌چیکَک | یه دوربین که بازنشسته شده! ❤️\n\nچیک‌چیکَک یه دوربین قرمز و قدیمیه که تصمیم گرفته دیگه عکس نگیره، فقط خاطره‌ها رو نگه داره!\n\nبا اون دکمه‌های برجسته، رنگ قرمز جیغ و قیافه‌ی نوستالژیکش، انگار از توی آلبوم عکس‌های قدیمی بیرون پریده. 📷\n\nنه باتری می‌خواد، نه حافظه‌ش پر می‌شه، نه هیچ‌وقت عکسات رو پاک می‌کنه! 😂\n\nفقط کافیه یکی از عکس‌های موردعلاقه‌ت رو بذاری توش تا یه گوشه از اتاقت تبدیل بشه به یه خاطره‌ی کوچیک و دوست‌داشتنی.\n\nبا دست ساخته شده، برای نگه داشتن لحظه‌هایی که دلت نمی‌خواد فراموششون کنی.\n\nمثل همه‌ی رَدها، چیک‌چیکَک هم لنگه نداره. 🤎", "📸 چیک‌چیکَک | یه دوربین که بازنشسته شده! ❤️\n\nچیک‌چیکَک یه دوربین قرمز و قدیمیه که تصمیم گرفته دیگه عکس نگیره، فقط خاطره‌ها رو نگه داره!\n\nبا اون دکمه‌های برجسته، رنگ قرمز جیغ و قیافه‌ی نوستالژیکش، انگار از توی آلبوم عکس‌های قدیمی بیرون پریده. 📷\n\nنه باتری می‌خواد، نه حافظه‌ش پر می‌شه، نه هیچ‌وقت عکسات رو پاک می‌کنه! 😂\n\nفقط کافیه یکی از عکس‌های موردعلاقه‌ت رو بذاری توش تا یه گوشه از اتاقت تبدیل بشه به یه خاطره‌ی کوچیک و دوست‌داشتنی.\n\nبا دست ساخته شده، برای نگه داشتن لحظه‌هایی که دلت نمی‌خواد فراموششون کنی.\n\nمثل همه‌ی رَدها، چیک‌چیکَک هم لنگه نداره. 🤎"),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/9cb89770ea2b316df6c3e848d13daed5",
        "alt": "چیک چیکَک",
        "enAlt": "چیک چیکَک",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/9cb89770ea2b316df6c3e848d13daed5"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 82,
    slug: "two-rings",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 2400000,
    usdPrice: 28,
    year: null,
    title: t("گلدان دوحلقه", "گلدان دوحلقه"),
    description: t("🌿 دوحلقه | یکی کافی نبود!\n\nدوحلقه از اون گلدون‌", "🌿 دوحلقه | یکی کافی نبود!\n\nدوحلقه از اون گلدون‌"),
    story: t("🌿 دوحلقه | یکی کافی نبود!\n\nدوحلقه از اون گلدون‌هاییه که تصمیم گرفته به‌جای یه دسته، دوتا حلقه‌ی بزرگ برای خودش داشته باشه!\n\nدو تا حلقه که از دو طرف بالا اومدن، یه بدنه‌ی سبزِ آروم با خال‌های ریز خاکی و لبه‌هایی که هنوز رد دست‌های سازنده‌ش روشون پیداست.\n\nیه‌کم شبیه یه سبد قدیمیه، یه‌کم شبیه یه مجسمه‌ی مدرن؛ ولی در نهایت فقط خودشه!\n\nمی‌تونی چند شاخه گل توش بذاری یا حتی خالی نگهش داری؛ دوحلقه بدون گل هم برای خودش حرفی برای گفتن داره. 🌱\n\nمثل همه‌ی رَدها، دوحلقه هم لنگه نداره. 🤎", "🌿 دوحلقه | یکی کافی نبود!\n\nدوحلقه از اون گلدون‌هاییه که تصمیم گرفته به‌جای یه دسته، دوتا حلقه‌ی بزرگ برای خودش داشته باشه!\n\nدو تا حلقه که از دو طرف بالا اومدن، یه بدنه‌ی سبزِ آروم با خال‌های ریز خاکی و لبه‌هایی که هنوز رد دست‌های سازنده‌ش روشون پیداست.\n\nیه‌کم شبیه یه سبد قدیمیه، یه‌کم شبیه یه مجسمه‌ی مدرن؛ ولی در نهایت فقط خودشه!\n\nمی‌تونی چند شاخه گل توش بذاری یا حتی خالی نگهش داری؛ دوحلقه بدون گل هم برای خودش حرفی برای گفتن داره. 🌱\n\nمثل همه‌ی رَدها، دوحلقه هم لنگه نداره. 🤎"),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/ced7235d9b841904772e4d49be0d4eaa",
        "alt": "گلدان دوحلقه",
        "enAlt": "گلدان دوحلقه",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/ced7235d9b841904772e4d49be0d4eaa"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/51f8b11a6eef86041aea6293c4662c1d",
        "alt": "گلدان دوحلقه",
        "enAlt": "گلدان دوحلقه",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/51f8b11a6eef86041aea6293c4662c1d"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/d4f6b9afeb0dce79b37f7c5398b43665",
        "alt": "گلدان دوحلقه",
        "enAlt": "گلدان دوحلقه",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/d4f6b9afeb0dce79b37f7c5398b43665"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/3feb51c54723114d3adfc1b10bbc7bad",
        "alt": "گلدان دوحلقه",
        "enAlt": "گلدان دوحلقه",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/3feb51c54723114d3adfc1b10bbc7bad"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 83,
    slug: "sheypori",
    artistId: "rad-studio",
    category: "ceramics",
    initialStatus: "available",
    price: 1100000,
    usdPrice: 13,
    year: null,
    title: t("ماگ شیپوری", "ماگ شیپوری"),
    description: t("🌼 شیپوری | یه دسته که دلش می‌خواست گل باشه! 💛\n", "🌼 شیپوری | یه دسته که دلش می‌خواست گل باشه! 💛\n"),
    story: t("🌼 شیپوری | یه دسته که دلش می‌خواست گل باشه! 💛\n\nشیپوری یه ظرف کرمِ خال‌خالیه که انگار موقع ساخته شدن، یه گل زرد از کنارش سبز شده!\n\nیه دسته‌ی زرد و پرپیچ‌وتاب که به‌جای یه حلقه‌ی معمولی، مثل گل شیپوری باز شده و برای خودش حسابی خودنمایی می‌کنه.\n\nبا اون فرم گرد و لعاب خال‌خالی، شیپوری یه ترکیب عجیب و دوست‌داشتنیه؛ یه‌کم ساده، یه‌کم جسور و اصلاً شبیه ظرف‌های معمولی نیست!\n\nبرای خوراکی‌های کوچیک، شکلات‌های موردعلاقه‌ت یا حتی فقط برای اینکه یه گوشه از خونه‌ات یه گل زردِ همیشه‌شکفته داشته باشی. 🌼\n\nمثل همه‌ی رَدها، شیپوری هم لنگه نداره. 🤎", "🌼 شیپوری | یه دسته که دلش می‌خواست گل باشه! 💛\n\nشیپوری یه ظرف کرمِ خال‌خالیه که انگار موقع ساخته شدن، یه گل زرد از کنارش سبز شده!\n\nیه دسته‌ی زرد و پرپیچ‌وتاب که به‌جای یه حلقه‌ی معمولی، مثل گل شیپوری باز شده و برای خودش حسابی خودنمایی می‌کنه.\n\nبا اون فرم گرد و لعاب خال‌خالی، شیپوری یه ترکیب عجیب و دوست‌داشتنیه؛ یه‌کم ساده، یه‌کم جسور و اصلاً شبیه ظرف‌های معمولی نیست!\n\nبرای خوراکی‌های کوچیک، شکلات‌های موردعلاقه‌ت یا حتی فقط برای اینکه یه گوشه از خونه‌ات یه گل زردِ همیشه‌شکفته داشته باشی. 🌼\n\nمثل همه‌ی رَدها، شیپوری هم لنگه نداره. 🤎"),
    dimensions: null,
    materials: {
      body: t("", ""),
      surface: null,
      process: null,
    },
    care: null,
    color: "#8a4938",
    accent: "#ead9bd",
    shape: "tall",
    images: [
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/6166363b7bff7af61645bb2b2de4582f",
        "alt": "ماگ شیپوری",
        "enAlt": "ماگ شیپوری",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/6166363b7bff7af61645bb2b2de4582f"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/96434eb46f2c3fc57c613b9080b515aa",
        "alt": "ماگ شیپوری",
        "enAlt": "ماگ شیپوری",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/96434eb46f2c3fc57c613b9080b515aa"
      },
      {
        "src": "https://api.rad-object.com/storage/rad-public/rad/pending/f3eaf408df10c5af84cd6b79af518b7a",
        "alt": "ماگ شیپوری",
        "enAlt": "ماگ شیپوری",
        "kind": "image",
        "thumbnail": "https://api.rad-object.com/storage/rad-public/rad/pending/f3eaf408df10c5af84cd6b79af518b7a"
      }
    ],
    passport: null,
    difference: null,
    owner: null,
  }
];
