import type { LocaleCopy } from "@/types/locale";
import type { PolicyDocument } from "../type";

/**
 * Iranian e-commerce law gives distance buyers at least seven working days
 * to withdraw. The 48-hour window below is published pending that review;
 * the order page and checkout copy in `purchase-path-copy.ts` repeat it.
 */
export const RETURN_WINDOW_REVIEW: LocaleCopy = {
  fa: "این مهلت در حال بازبینی با قانون تجارت الکترونیکی است و اگر تغییر کند، به نفع خریدار تغییر می‌کند.",
  en: "This window is being reviewed against Iran's e-commerce law; if it changes, it will change in the buyer's favour.",
};

export const RETURNS_POLICY: PolicyDocument = {
  slug: "returns",
  kind: "guide",
  icon: "package",
  title: { fa: "مرجوعی و آسیب", en: "Returns and damage" },
  summary: {
    fa: "اگر اثر آسیب‌دیده رسید یا نظرت عوض شد.",
    en: "If a work arrives damaged or you change your mind.",
  },
  versions: [
    {
      id: "2026-09-27",
      change: { fa: "نخستین نسخه‌ی منتشرشده.", en: "First published version." },
      points: [
        {
          id: "window",
          icon: "undo",
          label: { fa: "بازگشت اثر آماده", en: "Returning a ready work" },
          value: {
            fa: "درخواست تا ۴۸ ساعت پس از تحویل",
            en: "Ask within 48 hours of delivery",
          },
        },
        {
          id: "damage",
          icon: "camera",
          label: { fa: "گزارش آسیب", en: "Reporting damage" },
          value: {
            fa: "تا ۲۴ ساعت پس از تحویل، با عکس",
            en: "Within 24 hours of delivery, with photos",
          },
        },
        {
          id: "compensation",
          icon: "hammer",
          label: { fa: "جبران آسیب", en: "If it was damaged" },
          value: {
            fa: "مرمت یا بازگشت کامل وجه",
            en: "Repair or a full refund",
          },
        },
        {
          id: "custom",
          icon: "palette",
          label: { fa: "سفارش اختصاصی", en: "Custom pieces" },
          value: {
            fa: "بازگشت ندارد، مگر آسیب یا فرق اساسی",
            en: "Not returnable, unless damaged or substantially different",
          },
        },
      ],
      sections: [
        {
          id: "window",
          title: { fa: "بازگشت آثار آماده", en: "Returning a ready work" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "اگر اثر آماده‌ای به دستت رسید و آن‌طور که انتظار داشتی نبود، تا ۴۸ ساعت بعد از تحویل می‌توانی درخواست بازگشت بدهی. لازم نیست دلیلش را توضیح بدهی.",
                en: "If a ready work arrives and isn't what you expected, you can ask to return it within 48 hours of delivery. You don't need to give a reason.",
              },
            },
          ],
          underReview: RETURN_WINDOW_REVIEW,
        },
        {
          id: "how",
          title: { fa: "چطور برگردانم؟", en: "How to return it" },
          blocks: [
            {
              kind: "steps",
              items: [
                {
                  fa: "از صفحه‌ی سفارش، با موضوع «پیگیری سفارش»، درخواست بازگشت را بفرست.",
                  en: "Send the return request from your order page, under “Order follow-up”.",
                },
                {
                  fa: "اثر را سالم، استفاده‌نشده و در بسته‌بندی اصلی همراه شناسنامه آماده کن.",
                  en: "Pack the work unused and undamaged, in its original packaging with the certificate.",
                },
                {
                  fa: "نشانی و روش ارسال برگشت را برایت می‌فرستیم.",
                  en: "We send you the return address and how to ship it.",
                },
                {
                  fa: "بعد از رسیدن و بررسی اثر، مبلغ آن به کارتی که با آن پرداخت کرده بودی برمی‌گردد.",
                  en: "Once the work arrives and is checked, its price goes back to the card you paid from.",
                },
              ],
            },
            {
              kind: "note",
              text: {
                fa: "هزینه‌ی ارسال برگشت با خریدار است.",
                en: "The buyer pays for return shipping.",
              },
            },
          ],
        },
        {
          id: "not-returnable",
          title: {
            fa: "چه چیزهایی بازگشت ندارند",
            en: "What can't be returned",
          },
          blocks: [
            {
              kind: "list",
              items: [
                {
                  fa: "سفارش اختصاصی، چون بر اساس مشخصات شخصی تو ساخته شده؛ مگر اینکه آسیب دیده باشد یا با پیشنهاد تأییدشده فرق اساسی داشته باشد.",
                  en: "Custom pieces, because they were made to your personal specification — unless damaged or substantially different from the approved proposal.",
                },
                {
                  fa: "اثری که بعد از تحویل آسیب دیده، استفاده شده، یا بسته‌بندی و شناسنامه‌اش همراهش نیست.",
                  en: "A work damaged or used after delivery, or returned without its packaging and certificate.",
                },
              ],
            },
          ],
        },
        {
          id: "natural",
          title: { fa: "تفاوت‌های طبیعی", en: "Natural differences" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "تفاوت کوچک رنگ و بافت میان عکس و اثر، و ردهای دست و کوره، بخشی از هویت اثر یگانه است و به‌تنهایی آسیب حساب نمی‌شود. اما اگر همین تفاوت برایت پذیرفتنی نیست، اثر آماده را می‌توانی در مهلت بازگشت برگردانی.",
                en: "Small shifts in colour and texture between photo and work, and the marks of hand and kiln, are part of a one-of-one piece and aren't damage on their own. But if that difference doesn't work for you, you can return a ready work within the return window.",
              },
            },
          ],
        },
        {
          id: "damage",
          title: { fa: "آسیب در ارسال", en: "Damage in transit" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "همه‌ی آثار بیمه‌شده ارسال می‌شوند. اگر اثری آسیب‌دیده به دستت رسید، تا ۲۴ ساعت بعد از تحویل از صفحه‌ی سفارش گزارش آسیب بفرست، همراه:",
                en: "Every work ships insured. If one arrives damaged, send a damage report from your order page within 24 hours of delivery, with:",
              },
            },
            {
              kind: "list",
              items: [
                {
                  fa: "یک عکس از جعبه، همان‌طور که رسید",
                  en: "a photo of the box as it arrived",
                },
                {
                  fa: "یک عکس از خود آسیب",
                  en: "a photo of the damage itself",
                },
                {
                  fa: "چند خط درباره‌ی آنچه دیدی",
                  en: "a few lines about what you found",
                },
              ],
            },
            {
              kind: "p",
              text: {
                fa: "وضعیت بررسی را در همان صفحه می‌بینی: ثبت شد، در حال بررسی، تأیید شد یا تأیید نشد — همراه توضیح ما.",
                en: "You follow the review on the same page: received, under review, approved or not approved — with our explanation.",
              },
            },
            {
              kind: "note",
              text: {
                fa: "اگر دیرتر از ۲۴ ساعت متوجه آسیب شدی، باز هم گزارش بده؛ آن را می‌خوانیم و درباره‌اش جداگانه تصمیم می‌گیریم.",
                en: "If you notice damage after 24 hours, report it anyway; we read it and decide case by case.",
              },
            },
          ],
        },
        {
          id: "compensation",
          title: { fa: "جبران آسیب", en: "Putting it right" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "اگر آسیب تأیید شود، یکی از این دو را با هم انتخاب می‌کنیم:",
                en: "If the damage is confirmed, we choose one of these together:",
              },
            },
            {
              kind: "list",
              items: [
                {
                  fa: "مرمت به دست همان سازنده، اگر اثر قابل مرمت باشد؛ هزینه‌ی رفت‌وبرگشت با رَد است.",
                  en: "Repair by the same maker, if the work can be repaired; RAD pays shipping both ways.",
                },
                {
                  fa: "بازگشت کامل مبلغ اثر.",
                  en: "A full refund of the work's price.",
                },
              ],
            },
            {
              kind: "note",
              text: {
                fa: "چون هر اثر یگانه است، جایگزین کردنش با نسخه‌ای یکسان ممکن نیست.",
                en: "Because every work is one of one, it can't be swapped for an identical copy.",
              },
            },
          ],
        },
      ],
    },
  ],
};
