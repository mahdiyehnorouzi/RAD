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
      question: "ارسال چگونه است؟",
      answer:
        "پس از آماده‌شدن اثر، سفارش‌های تهران با پست یا پیک و سفارش‌های شهرهای دیگر با پست ارسال می‌شوند.",
    },
    {
      id: "returns",
      icon: "palette",
      question: "رنگ، متریال و مرجوعی",
      answer:
        "نور نمایشگر می‌تواند رنگ و بافت را کمی تغییر دهد. آثار آماده تا ۴۸ ساعت امکان درخواست بازگشت دارند؛ سفارش شخصی مرجوع نمی‌شود، مگر آسیب‌دیده برسد یا با پیشنهاد تأییدشده فرق اساسی داشته باشد.",
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
      question: "How is it sent?",
      answer:
        "After the work is ready, Tehran orders are sent by post or courier; orders to other cities are sent by post.",
    },
    {
      id: "returns",
      icon: "palette",
      question: "Colour, material, and returns",
      answer:
        "Screens may shift colour and texture slightly. Ready works can be returned within 48 hours; custom works cannot, unless damaged or substantially different from the approved proposal.",
    },
  ],
};
