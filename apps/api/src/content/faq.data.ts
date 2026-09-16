export type FaqIcon = "shield-check" | "package-check" | "truck" | "palette";

export type FaqEntry = {
  id: string;
  icon: FaqIcon;
  question: { fa: string; en: string };
  answer: { fa: string; en: string };
};

export const faqSection = {
  eyebrow: { fa: "ارسال آثار رَد", en: "RAD DELIVERY" },
  title: { fa: "پیش از خرید بدانید", en: "Before you buy" },
  items: [
    {
      id: "damage",
      icon: "shield-check",
      question: { fa: "اگر اثر در ارسال آسیب ببیند؟", en: "What if it is damaged?" },
      answer: {
        fa: "تمام آثار بیمه‌اند. آسیب را تا ۲۴ ساعت با عکس اعلام کنید؛ رَد مسئول پیگیری و جبران است.",
        en: "Every work is insured. Report damage with photos within 24 hours; RAD manages the resolution.",
      },
    },
    {
      id: "packaging",
      icon: "package-check",
      question: { fa: "بسته‌بندی چگونه است؟", en: "How is it packed?" },
      answer: {
        fa: "هر اثر در جعبه دولایه، با محافظ متناسب با فرم و شناسنامه امضاشده ارسال می‌شود.",
        en: "Each work travels in a double box with form-fitted protection and a signed certificate.",
      },
    },
    {
      id: "delivery",
      icon: "truck",
      question: { fa: "زمان و محدوده ارسال؟", en: "When will it arrive?" },
      answer: {
        fa: "تهران ۲ تا ۴ روز کاری و شهرستان ۴ تا ۸ روز کاری؛ ارسال بیمه‌شده رایگان است.",
        en: "Tehran: 2–4 working days. Other cities: 4–8. Insured delivery is complimentary.",
      },
    },
    {
      id: "returns",
      icon: "palette",
      question: { fa: "رنگ، متریال و مرجوعی", en: "Colour, material, and returns" },
      answer: {
        fa: "نور نمایشگر می‌تواند رنگ و بافت را کمی تغییر دهد. آثار آماده تا ۴۸ ساعت امکان درخواست بازگشت دارند؛ سفارش شخصی مرجوع نمی‌شود.",
        en: "Screens may shift colour and texture slightly. Ready works can be returned within 48 hours; custom works cannot be returned.",
      },
    },
  ] satisfies FaqEntry[],
};
