import type { PolicySlug } from "@rad/types";
import type { LocaleCopy } from "@/types/locale";

export const helpCopy = {
  fa: {
    title: "قبل از اینکه رَدِ تو برسد.",
    lede: "از ثبت سفارش تا ساخت، بسته‌بندی و رسیدن اثر به دستت؛ اینجا همه‌چیز رو ساده توضیح دادیم.",
    why: "این قوانین برای این نوشته شده‌اند که با خیال راحت تصمیم بگیری؛ مخصوصاً وقتی هر اثر فقط یک نسخه دارد و پرداخت فعلاً کارت‌به‌کارت است.",
    topicsTitle: "دنبال چی می‌گردی؟",
    journeyTitle: "مسیر یک خرید، و آنچه در هر قدم مهم است",
    questionsTitle: "سؤال‌های پرتکرار",
    readMore: "متن کامل",
    contactTitle: "جواب سؤالت رو پیدا نکردی؟",
    contactBody: "مستقیم با رَد حرف بزن؛ پیامت رو یه آدم می‌خونه و جواب می‌ده.",
    contactAction: "پیام به رَد",
    legalTitle: "متن‌های رسمی",
    updated: "آخرین به‌روزرسانی",
    allGuides: "همه‌ی راهنماها",
    inShort: "به زبان ساده",
    onThisPage: "در این صفحه",
    version: "نسخه‌ی",
    history: "نسخه‌های این متن",
    current: "نسخه‌ی فعلی",
    viewing: "در حال دیدن",
    archivedNotice:
      "این نسخه‌ی قدیمی این متن است و فقط برای سفارش‌هایی معتبر است که با آن ثبت شده‌اند.",
    archivedCurrent: "نسخه‌ی فعلی از {date}",
    seeCurrent: "دیدن نسخه‌ی فعلی",
    underReview: "در حال بازبینی حقوقی",
    otherGuides: "راهنماهای دیگر",
    notFoundTitle: "این متن پیدا نشد",
    notFoundBody:
      "شاید نشانی عوض شده باشد. همه‌ی راهنماها و متن‌های رسمی در صفحه‌ی راهنما هستند.",
  },
  en: {
    title: "Before your RAD arrives.",
    lede: "From placing an order to making, packing and the work reaching you — everything, explained simply.",
    why: "These rules exist so you can decide with confidence — especially when every work exists once and payment is, for now, by card-to-card transfer.",
    topicsTitle: "What are you looking for?",
    journeyTitle: "One purchase, and what matters at each step",
    questionsTitle: "Common questions",
    readMore: "Full text",
    contactTitle: "Didn't find your answer?",
    contactBody:
      "Talk to RAD directly; a person reads your message and replies.",
    contactAction: "Message RAD",
    legalTitle: "Official texts",
    updated: "Last updated",
    allGuides: "All guides",
    inShort: "In short",
    onThisPage: "On this page",
    version: "Version",
    history: "Versions of this text",
    current: "Current version",
    viewing: "Viewing",
    archivedNotice:
      "This is an older version of this text. It applies only to orders placed while it was current.",
    archivedCurrent: "Current version since {date}",
    seeCurrent: "See the current version",
    underReview: "Under legal review",
    otherGuides: "Other guides",
    notFoundTitle: "We couldn't find this text",
    notFoundBody:
      "The address may have changed. Every guide and official text is on the help page.",
  },
} as const;

export type JourneyStep = {
  id: string;
  title: LocaleCopy;
  fact: LocaleCopy;
  slug: PolicySlug;
  section: string;
};

/** The hub's purchase path: the one rule that matters at each step. */
export const HELP_JOURNEY: JourneyStep[] = [
  {
    id: "choose",
    title: { fa: "انتخاب اثر", en: "Choosing" },
    fact: {
      fa: "هر اثر یک نسخه دارد و بعد از فروش در آرشیو می‌ماند.",
      en: "Each work exists once and stays in the archive after it sells.",
    },
    slug: "buying",
    section: "one-of-one",
  },
  {
    id: "bag",
    title: { fa: "سبد", en: "Your bag" },
    fact: {
      fa: "۱۵ دقیقه برای تو کنار گذاشته می‌شود؛ ارسال رایگان است.",
      en: "Held for you for 15 minutes; shipping is free.",
    },
    slug: "buying",
    section: "bag",
  },
  {
    id: "pay",
    title: { fa: "پرداخت", en: "Paying" },
    fact: {
      fa: "۳۰ دقیقه برای واریز کارت‌به‌کارت و فرستادن رسید.",
      en: "30 minutes to transfer and send the receipt.",
    },
    slug: "buying",
    section: "payment",
  },
  {
    id: "confirm",
    title: { fa: "تأیید", en: "Confirmation" },
    fact: {
      fa: "یک نفر از رَد رسید را با واریز تطبیق می‌دهد.",
      en: "A person at RAD matches the receipt to the transfer.",
    },
    slug: "buying",
    section: "confirmation",
  },
  {
    id: "arrive",
    title: { fa: "تحویل", en: "Delivery" },
    fact: {
      fa: "۲۴ ساعت برای گزارش آسیب، ۴۸ ساعت برای درخواست بازگشت.",
      en: "24 hours to report damage, 48 to ask for a return.",
    },
    slug: "returns",
    section: "damage",
  },
];
