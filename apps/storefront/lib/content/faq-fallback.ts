import type { FaqContent } from "@rad/types";

/** Static FAQ when the API is unreachable during SSR (mirrors API faq.data). */
export const faqFallbackFa: FaqContent = {
  eyebrow: "ارسال آثار رَد",
  title: "پیش از خرید بدانید",
  items: [
    {
      id: "damage",
      icon: "shield-check",
      question: "اگر اثر در ارسال آسیب ببیند؟",
      answer:
        "تمام آثار بیمه‌اند. آسیب را تا ۲۴ ساعت با عکس اعلام کنید؛ رَد مسئول پیگیری و جبران است.",
    },
    {
      id: "packaging",
      icon: "package-check",
      question: "بسته‌بندی چگونه است؟",
      answer:
        "هر اثر در جعبه دولایه، با محافظ متناسب با فرم و شناسنامه امضاشده ارسال می‌شود.",
    },
    {
      id: "delivery",
      icon: "truck",
      question: "زمان و محدوده ارسال؟",
      answer:
        "تهران ۲ تا ۴ روز کاری و شهرستان ۴ تا ۸ روز کاری؛ ارسال بیمه‌شده رایگان است.",
    },
    {
      id: "returns",
      icon: "palette",
      question: "رنگ، متریال و مرجوعی",
      answer:
        "نور نمایشگر می‌تواند رنگ و بافت را کمی تغییر دهد. آثار آماده تا ۴۸ ساعت امکان درخواست بازگشت دارند؛ سفارش شخصی مرجوع نمی‌شود.",
    },
  ],
};

export const faqFallbackEn: FaqContent = {
  eyebrow: "RAD DELIVERY",
  title: "Before you buy",
  items: [
    {
      id: "damage",
      icon: "shield-check",
      question: "What if it is damaged?",
      answer:
        "Every work is insured. Report damage with photos within 24 hours; RAD manages the resolution.",
    },
    {
      id: "packaging",
      icon: "package-check",
      question: "How is it packed?",
      answer:
        "Each work travels in a double box with form-fitted protection and a signed certificate.",
    },
    {
      id: "delivery",
      icon: "truck",
      question: "When will it arrive?",
      answer:
        "Tehran: 2–4 working days. Other cities: 4–8. Insured delivery is complimentary.",
    },
    {
      id: "returns",
      icon: "palette",
      question: "Colour, material, and returns",
      answer:
        "Screens may shift colour and texture slightly. Ready works can be returned within 48 hours; custom works cannot be returned.",
    },
  ],
};
