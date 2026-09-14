import type { LocaleCopy } from "@/types/locale";
import type { PassportTraits } from "@/components/passport/type";

function copy(fa: string, en: string): LocaleCopy {
  return { fa, en };
}

export const SHAPE_QUESTIONS: Array<{
  trait: keyof PassportTraits;
  prompt: LocaleCopy;
  choices: Array<{ label: LocaleCopy; value: number }>;
}> = [
  {
    trait: "crooked",
    prompt: copy("صاف یا کج؟", "Straight or crooked?"),
    choices: [
      { label: copy("صاف", "Straight"), value: 0.15 },
      { label: copy("کج", "Crooked"), value: 0.9 },
    ],
  },
  {
    trait: "quiet",
    prompt: copy("ساکت یا شلوغ؟", "Quiet or busy?"),
    choices: [
      { label: copy("ساکت", "Quiet"), value: 0.9 },
      { label: copy("شلوغ", "Busy"), value: 0.15 },
    ],
  },
  {
    trait: "worn",
    prompt: copy("لبه‌ی تمیز یا دست‌خورده؟", "A clean edge or a worn one?"),
    choices: [
      { label: copy("لبه‌ی تمیز", "Clean edge"), value: 0.2 },
      { label: copy("دست‌خورده", "Worn by hand"), value: 0.9 },
    ],
  },
  {
    trait: "surprise",
    prompt: copy(
      "رنگی که دوست داری یا رنگی که غافلگیرت می‌کند؟",
      "A colour you like, or a colour that surprises you?",
    ),
    choices: [
      { label: copy("رنگی که دوست دارم", "A colour I like"), value: 0.2 },
      { label: copy("رنگی که غافلگیرم می‌کند", "A colour that surprises me"), value: 0.9 },
    ],
  },
  {
    trait: "strange",
    prompt: copy("کاربردی یا عجیب؟", "Useful or strange?"),
    choices: [
      { label: copy("کاربردی", "Useful"), value: 0.2 },
      { label: copy("عجیب", "Strange"), value: 0.9 },
    ],
  },
];
