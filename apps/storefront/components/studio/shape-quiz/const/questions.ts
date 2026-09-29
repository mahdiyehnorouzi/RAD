import type { LocaleCopy } from "@/types/locale";
import type { PassportTraits } from "@/components/passport/type";

function copy(fa: string, en: string): LocaleCopy {
  return { fa, en };
}

export type ShapeChoice = {
  label: LocaleCopy;
  note: LocaleCopy;
  photo: { src: string; alt: LocaleCopy };
  value: number;
};

export type ShapeQuestion = {
  trait: keyof PassportTraits;
  prompt: LocaleCopy;
  hint: LocaleCopy;
  choices: [ShapeChoice, ShapeChoice];
};

export const SHAPE_QUESTIONS: ShapeQuestion[] = [
  {
    trait: "crooked",
    prompt: copy("صاف یا کج؟", "Straight or crooked?"),
    hint: copy(
      "به شکل‌هایی که در زندگی روزمره دوست داری نزدیک‌تره کدومه؟",
      "Which is closer to the shapes you like around you every day?",
    ),
    choices: [
      {
        label: copy("صاف", "Straight"),
        note: copy("منظم، متعادل و ساده", "Even, balanced and simple"),
        photo: {
          src: "/shape/q1-straight.jpg",
          alt: copy("کاسه‌ی سفالی صاف و متقارن روی سنگ", "A smooth, symmetrical stoneware bowl on stone"),
        },
        value: 0.15,
      },
      {
        label: copy("کج", "Crooked"),
        note: copy("آزاد، نامتقارن و خاص", "Free, uneven and particular"),
        photo: {
          src: "/shape/q1-crooked.jpg",
          alt: copy("کاسه‌ی سفالی کج با لبه‌ی ناهموار", "A crooked stoneware bowl with an uneven rim"),
        },
        value: 0.9,
      },
    ],
  },
  {
    trait: "quiet",
    prompt: copy("ساکت یا شلوغ؟", "Quiet or busy?"),
    hint: copy(
      "کنار چیزهایی که هر روز می‌بینی، کدوم رو بیشتر می‌خوای؟",
      "Next to the things you see every day, which would you rather have?",
    ),
    choices: [
      {
        label: copy("ساکت", "Quiet"),
        note: copy("ساده، آرام و بی‌ادعا", "Plain, calm and unassuming"),
        photo: {
          src: "/shape/q2-quiet.jpg",
          alt: copy("کاسه‌ی سفید مات بدون نقش", "A plain matte white bowl"),
        },
        value: 0.9,
      },
      {
        label: copy("شلوغ", "Busy"),
        note: copy("پرنقش، شاد و پرحرف", "Patterned, lively and talkative"),
        photo: {
          src: "/shape/q2-busy.jpg",
          alt: copy("کاسه‌ی دست‌نقاش با نقش‌های رنگی", "A hand-painted bowl covered in colourful patterns"),
        },
        value: 0.15,
      },
    ],
  },
  {
    trait: "worn",
    prompt: copy("لبه‌ی تمیز یا دست‌خورده؟", "A clean edge or a worn one?"),
    hint: copy(
      "در لبه و جزئیات فرم‌ها، کدوم حس رو بیشتر دوست داری؟",
      "In the edges and details of a form, which feeling do you like more?",
    ),
    choices: [
      {
        label: copy("لبه‌ی تمیز", "Clean edge"),
        note: copy("دقیق، یکدست و مینیمال", "Precise, even and minimal"),
        photo: {
          src: "/shape/q3-clean.jpg",
          alt: copy("نمای نزدیک لبه‌ی صاف یک کاسه", "A close view of a bowl's clean rim"),
        },
        value: 0.2,
      },
      {
        label: copy("دست‌خورده", "Worn by hand"),
        note: copy("طبیعی، زنده و پر از جزئیات", "Natural, alive and full of detail"),
        photo: {
          src: "/shape/q3-worn.jpg",
          alt: copy("نمای نزدیک لبه‌ی زبر و دست‌ساز یک کاسه", "A close view of a bowl's rough, handmade rim"),
        },
        value: 0.9,
      },
    ],
  },
  {
    trait: "surprise",
    prompt: copy(
      "رنگی که دوست داری یا رنگی که غافلگیرت می‌کند؟",
      "A colour you like, or a colour that surprises you?",
    ),
    hint: copy(
      "وقتی رَدت تموم می‌شه، دوست داری چی ببینی؟",
      "When your RAD is finished, what would you like to see?",
    ),
    choices: [
      {
        label: copy("رنگی که دوست دارم", "A colour I like"),
        note: copy("آشنا، هماهنگ و آرام", "Familiar, in tune and calm"),
        photo: {
          src: "/shape/q4-liked.jpg",
          alt: copy("گلدان کوچک با لعاب سبز ملایم", "A small vase in a soft sage glaze"),
        },
        value: 0.2,
      },
      {
        label: copy("رنگی که غافلگیرم می‌کند", "A colour that surprises me"),
        note: copy("پیش‌بینی‌نشده، جسور و زنده", "Unplanned, bold and alive"),
        photo: {
          src: "/shape/q4-surprise.jpg",
          alt: copy("گلدان کوچک با لعاب آبی و نارنجیِ شره‌کرده", "A small vase with blue glaze running over rust orange"),
        },
        value: 0.9,
      },
    ],
  },
  {
    trait: "strange",
    prompt: copy("کاربردی یا عجیب؟", "Useful or strange?"),
    hint: copy(
      "رَدت بیشتر قراره به کار بیاد، یا فقط باشه و نگاهش کنی؟",
      "Is your RAD for using, or for simply being there to look at?",
    ),
    choices: [
      {
        label: copy("کاربردی", "Useful"),
        note: copy("هر روز در دست، بی‌دردسر", "In the hand every day, no fuss"),
        photo: {
          src: "/shape/q5-useful.jpg",
          alt: copy("ماگ سفالی ساده با دسته", "A simple stoneware mug with a handle"),
        },
        value: 0.2,
      },
      {
        label: copy("عجیب", "Strange"),
        note: copy("بازیگوش، سؤال‌برانگیز و یگانه", "Playful, puzzling and one of a kind"),
        photo: {
          src: "/shape/q5-strange.jpg",
          alt: copy("ظرف سفالی سه‌پایه با سوراخی در بدنه", "A three-legged clay vessel with a hole in its side"),
        },
        value: 0.9,
      },
    ],
  },
];
