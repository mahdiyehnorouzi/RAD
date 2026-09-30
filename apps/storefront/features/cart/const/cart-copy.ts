export const cartCopy = {
  fa: {
    addedTitle: "به کیسه‌ی شما اضافه شد.",
    addedManyTitle: "{count} اثر در کیسه‌ی شماست.",
    addedBody:
      "می‌توانید همین حالا سفارش را ثبت کنید یا به دیدن آثار ادامه دهید.",
    blockedTitle: "کیسه‌ی شما نیاز به بررسی دارد.",
    blockedBody:
      "یکی از آثار دیگر در دسترس نیست. آن را حذف کنید تا بتوانید ادامه دهید.",
    listLabel: "آثار کیسه",
    quantity: "تعداد",
    remove: "حذف {name} از کیسه",
    holdTitleOne: "این اثر برای شما رزرو شده است.",
    holdTitleMany: "این آثار برای شما رزرو شده‌اند.",
    holdBody: "اگر پرداخت را تکمیل نکنید، بعد از {time} به فروشگاه برمی‌گردد.",
    shipping: "ارسال بیمه‌شده رایگان",
    checkout: "ادامه و ثبت سفارش",
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
