import type { DamageReportStatus, DamageResolution } from "@rad/types";
import type { LocaleCopy } from "@/types/locale";

export const damageReportCopy = {
  fa: {
    title: "اثر آسیب‌دیده رسید؟",
    lede: "همه‌ی آثار بیمه‌شده ارسال می‌شوند. با دو عکس و چند خط توضیح گزارش بده تا بررسی‌اش کنیم.",
    deadline: "تا {date} فرصت گزارش داری.",
    deadlinePassed:
      "مهلت ۲۴ ساعته تمام شده، ولی باز هم گزارش بده؛ آن را می‌خوانیم و جداگانه تصمیم می‌گیریم.",
    deadlineUnknown: "تا ۲۴ ساعت بعد از تحویل فرصت گزارش داری.",
    compensation:
      "اگر آسیب تأیید شود: مرمت به دست همان سازنده با هزینه‌ی رفت‌وبرگشت رَد، یا بازگشت کامل مبلغ اثر.",
    open: "گزارش آسیب",
    packagingLabel: "عکس جعبه، همان‌طور که رسید",
    damageLabel: "عکس خود آسیب",
    choosePhoto: "انتخاب عکس",
    replacePhoto: "عوض کردن عکس",
    preparing: "در حال آماده‌سازی عکس…",
    bodyLabel: "چه دیدی؟",
    bodyHint: "مثلاً: لبه‌ی کاسه ترک برداشته و جعبه از یک گوشه له شده بود.",
    submit: "فرستادن گزارش",
    sending: "در حال فرستادن…",
    cancel: "انصراف",
    photoRequired: "هر دو عکس لازم است.",
    bodyRequired: "چند کلمه درباره‌ی آسیب بنویس.",
    photoError: "فقط عکس JPEG، PNG یا WebP تا ۱۰ مگابایت.",
    sent: "گزارشت ثبت شد. وضعیت بررسی همین‌جا به‌روز می‌شود.",
    reportsTitle: "گزارش‌های آسیب این سفارش",
    sentOn: "فرستاده‌شده در {date}",
    late: "بعد از مهلت ۲۴ ساعته",
    ourNote: "پاسخ رَد",
    resolution: "جبران",
    packagingAlt: "عکس جعبه",
    damageAlt: "عکس آسیب",
    fullRule: "قانون آسیب در ارسال",
  },
  en: {
    title: "Did the work arrive damaged?",
    lede: "Every work ships insured. Report it with two photos and a few lines, and we'll review it.",
    deadline: "You have until {date} to report it.",
    deadlinePassed:
      "The 24-hour window has passed, but report it anyway; we'll read it and decide case by case.",
    deadlineUnknown: "You have 24 hours from delivery to report it.",
    compensation:
      "If the damage is confirmed: repair by the same maker, with RAD paying shipping both ways, or a full refund.",
    open: "Report damage",
    packagingLabel: "Photo of the box as it arrived",
    damageLabel: "Photo of the damage",
    choosePhoto: "Choose photo",
    replacePhoto: "Replace photo",
    preparing: "Preparing photo…",
    bodyLabel: "What did you find?",
    bodyHint:
      "For example: the bowl's rim is cracked and one corner of the box was crushed.",
    submit: "Send report",
    sending: "Sending…",
    cancel: "Cancel",
    photoRequired: "Both photos are needed.",
    bodyRequired: "Write a few words about the damage.",
    photoError: "JPEG, PNG or WebP photos up to 10 MB only.",
    sent: "Your report is in. Its review status updates right here.",
    reportsTitle: "Damage reports on this order",
    sentOn: "Sent {date}",
    late: "After the 24-hour window",
    ourNote: "RAD's reply",
    resolution: "Remedy",
    packagingAlt: "Photo of the box",
    damageAlt: "Photo of the damage",
    fullRule: "Damage in transit rule",
  },
} as const;

export const DAMAGE_STATUS_LABELS: Record<DamageReportStatus, LocaleCopy> = {
  submitted: { fa: "ثبت شد", en: "Received" },
  reviewing: { fa: "در حال بررسی", en: "Under review" },
  approved: { fa: "تأیید شد", en: "Approved" },
  declined: { fa: "تأیید نشد", en: "Not approved" },
};

export const DAMAGE_RESOLUTION_LABELS: Record<DamageResolution, LocaleCopy> = {
  repair: { fa: "مرمت به دست سازنده", en: "Repair by the maker" },
  refund: { fa: "بازگشت کامل مبلغ", en: "Full refund" },
};
