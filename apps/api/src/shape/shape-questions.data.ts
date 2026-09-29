import type { ShapeQuestionView } from "./type";

/** Quiz questions inserted once on an empty database; staff edit them in the admin. */
export const defaultShapeQuestions: ShapeQuestionView[] = [
  {
    id: "crooked",
    trait: "crooked",
    prompt: { fa: "صاف یا کج؟", en: "Straight or crooked?" },
    hint: {
      fa: "به شکل‌هایی که در زندگی روزمره دوست داری نزدیک‌تره کدومه؟",
      en: "Which is closer to the shapes you like around you every day?",
    },
    choices: [
      {
        label: { fa: "صاف", en: "Straight" },
        note: { fa: "منظم، متعادل و ساده", en: "Even, balanced and simple" },
        photo: {
          src: "/shape/q1-straight.webp",
          alt: {
            fa: "کاسه‌ی سفالی صاف و متقارن روی سنگ",
            en: "A smooth, symmetrical stoneware bowl on stone",
          },
        },
        value: 0.15,
      },
      {
        label: { fa: "کج", en: "Crooked" },
        note: { fa: "آزاد، نامتقارن و خاص", en: "Free, uneven and particular" },
        photo: {
          src: "/shape/q1-crooked.webp",
          alt: {
            fa: "کاسه‌ی سفالی کج با لبه‌ی ناهموار",
            en: "A crooked stoneware bowl with an uneven rim",
          },
        },
        value: 0.9,
      },
    ],
  },
  {
    id: "quiet",
    trait: "quiet",
    prompt: { fa: "ساکت یا شلوغ؟", en: "Quiet or busy?" },
    hint: {
      fa: "کنار چیزهایی که هر روز می‌بینی، کدوم رو بیشتر می‌خوای؟",
      en: "Next to the things you see every day, which would you rather have?",
    },
    choices: [
      {
        label: { fa: "ساکت", en: "Quiet" },
        note: { fa: "ساده، آرام و بی‌ادعا", en: "Plain, calm and unassuming" },
        photo: {
          src: "/shape/q2-quiet.webp",
          alt: { fa: "کاسه‌ی سفید مات بدون نقش", en: "A plain matte white bowl" },
        },
        value: 0.9,
      },
      {
        label: { fa: "شلوغ", en: "Busy" },
        note: { fa: "پرنقش، شاد و پرحرف", en: "Patterned, lively and talkative" },
        photo: {
          src: "/shape/q2-busy.webp",
          alt: {
            fa: "کاسه‌ی دست‌نقاش با نقش‌های رنگی",
            en: "A hand-painted bowl covered in colourful patterns",
          },
        },
        value: 0.15,
      },
    ],
  },
  {
    id: "worn",
    trait: "worn",
    prompt: { fa: "لبه‌ی تمیز یا دست‌خورده؟", en: "A clean edge or a worn one?" },
    hint: {
      fa: "در لبه و جزئیات فرم‌ها، کدوم حس رو بیشتر دوست داری؟",
      en: "In the edges and details of a form, which feeling do you like more?",
    },
    choices: [
      {
        label: { fa: "لبه‌ی تمیز", en: "Clean edge" },
        note: { fa: "دقیق، یکدست و مینیمال", en: "Precise, even and minimal" },
        photo: {
          src: "/shape/q3-clean.webp",
          alt: {
            fa: "نمای نزدیک لبه‌ی صاف یک کاسه",
            en: "A close view of a bowl's clean rim",
          },
        },
        value: 0.2,
      },
      {
        label: { fa: "دست‌خورده", en: "Worn by hand" },
        note: {
          fa: "طبیعی، زنده و پر از جزئیات",
          en: "Natural, alive and full of detail",
        },
        photo: {
          src: "/shape/q3-worn.webp",
          alt: {
            fa: "نمای نزدیک لبه‌ی زبر و دست‌ساز یک کاسه",
            en: "A close view of a bowl's rough, handmade rim",
          },
        },
        value: 0.9,
      },
    ],
  },
  {
    id: "surprise",
    trait: "surprise",
    prompt: {
      fa: "رنگی که دوست داری یا رنگی که غافلگیرت می‌کند؟",
      en: "A colour you like, or a colour that surprises you?",
    },
    hint: {
      fa: "وقتی رَدت تموم می‌شه، دوست داری چی ببینی؟",
      en: "When your RAD is finished, what would you like to see?",
    },
    choices: [
      {
        label: { fa: "رنگی که دوست دارم", en: "A colour I like" },
        note: { fa: "آشنا، هماهنگ و آرام", en: "Familiar, in tune and calm" },
        photo: {
          src: "/shape/q4-liked.webp",
          alt: {
            fa: "گلدان کوچک با لعاب سبز ملایم",
            en: "A small vase in a soft sage glaze",
          },
        },
        value: 0.2,
      },
      {
        label: { fa: "رنگی که غافلگیرم می‌کند", en: "A colour that surprises me" },
        note: { fa: "پیش‌بینی‌نشده، جسور و زنده", en: "Unplanned, bold and alive" },
        photo: {
          src: "/shape/q4-surprise.webp",
          alt: {
            fa: "گلدان کوچک با لعاب آبی و نارنجیِ شره‌کرده",
            en: "A small vase with blue glaze running over rust orange",
          },
        },
        value: 0.9,
      },
    ],
  },
  {
    id: "strange",
    trait: "strange",
    prompt: { fa: "کاربردی یا عجیب؟", en: "Useful or strange?" },
    hint: {
      fa: "رَدت بیشتر قراره به کار بیاد، یا فقط باشه و نگاهش کنی؟",
      en: "Is your RAD for using, or for simply being there to look at?",
    },
    choices: [
      {
        label: { fa: "کاربردی", en: "Useful" },
        note: { fa: "هر روز در دست، بی‌دردسر", en: "In the hand every day, no fuss" },
        photo: {
          src: "/shape/q5-useful.webp",
          alt: {
            fa: "ماگ سفالی ساده با دسته",
            en: "A simple stoneware mug with a handle",
          },
        },
        value: 0.2,
      },
      {
        label: { fa: "عجیب", en: "Strange" },
        note: {
          fa: "بازیگوش، سؤال‌برانگیز و یگانه",
          en: "Playful, puzzling and one of a kind",
        },
        photo: {
          src: "/shape/q5-strange.webp",
          alt: {
            fa: "ظرف سفالی سه‌پایه با سوراخی در بدنه",
            en: "A three-legged clay vessel with a hole in its side",
          },
        },
        value: 0.9,
      },
    ],
  },
];
