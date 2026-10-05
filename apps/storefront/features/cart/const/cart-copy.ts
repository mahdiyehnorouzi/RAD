export const cartCopy = {
  fa: {
    addedTitle: "رفت توی کیسه.",
    addedManyTitle: "{count} اثر در کیسه‌ی شماست.",
    addedBody: "می‌تونی بری سراغ ثبت سفارش یا یه دور دیگه بین رَدها بچرخی.",
    blockedTitle: "یکی از رَدهای کیسه دیگه موجود نیست.",
    blockedBody: "حذفش کن تا بتونی ادامه بدی.",
    listLabel: "آثار کیسه",
    quantity: "تعداد",
    remove: "حذف {name} از کیسه",
    holdTitleOne: "فعلاً برای تو کنار گذاشتیمش.",
    holdTitleMany: "فعلاً این رَدها رو برای تو کنار گذاشتیم.",
    holdBody:
      "اگه تا {time} سفارشت رو کامل نکنی، دوباره برای بقیه قابل خرید می‌شه.",
    shipping: "ارسال بیمه‌شده رایگان",
    checkout: "ادامه‌ی خرید",
    browse: "ادامه‌ی دیدن آثار",
  },
  en: {
    addedTitle: "Added to your bag.",
    addedManyTitle: "{count} works in your bag.",
    addedBody: "Place your order now, or keep browsing the collection.",
    blockedTitle: "Your bag needs a look.",
    blockedBody:
      "One of the works is no longer available. Remove it to continue.",
    listLabel: "Works in your bag",
    quantity: "Qty",
    remove: "Remove {name} from the bag",
    holdTitleOne: "This work is reserved for you.",
    holdTitleMany: "These works are reserved for you.",
    holdBody: "If payment isn't completed, it returns to the shop in {time}.",
    shipping: "Free insured shipping",
    checkout: "Continue to checkout",
    browse: "Keep browsing",
  },
} as const;

export function fillCartCopy(template: string, vars: Record<string, string>) {
  return template.replace(
    /\{(\w+)\}/g,
    (match, key: string) => vars[key] ?? match,
  );
}
