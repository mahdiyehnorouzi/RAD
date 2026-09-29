export const quizCopy = {
  fa: {
    title: "رَد من چه شکلیه؟",
    lede: "پنج سؤال کوتاه. بعد سه رَد واقعی از آرشیو مخصوص تو.",
    stepsLabel: "مراحل پرسش",
    step: "مرحله {n}",
    stageOf: "مرحله {current} از {total}",
    next: "مرحله بعد",
    finish: "دیدن نتیجه",
    back: "مرحله قبل",
    home: "بازگشت به خانه",
    done: "تمام شد!",
    resultTitle: "رَدهای پیشنهادی برای تو",
    resultLede:
      "بر اساس پاسخ‌های تو، این {count} اثر از آرشیو رَد با حال‌وهوای تو بیشترین هم‌خوانی را دارند.",
    code: "رَد {code}",
    view: "دیدن اثر",
    again: "پاسخ‌گویی مجدد (از اول)",
  },
  en: {
    title: "What shape is my RAD?",
    lede: "Five short questions. Then three real RADs from the archive, picked for you.",
    stepsLabel: "Quiz steps",
    step: "Step {n}",
    stageOf: "Step {current} of {total}",
    next: "Next step",
    finish: "See my RADs",
    back: "Previous step",
    home: "Back to home",
    done: "Done!",
    resultTitle: "RADs picked for you",
    resultLede:
      "Based on your answers, these {count} works from the RAD archive sit closest to your feeling.",
    code: "RAD {code}",
    view: "View the work",
    again: "Answer again (from the start)",
  },
} as const;

export type QuizCopy = (typeof quizCopy)[keyof typeof quizCopy];

export function fill(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
