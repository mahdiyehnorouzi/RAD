import { Fingerprint, RotateCcw, Truck, type LucideIcon } from "lucide-react";
import type { LocaleCopy } from "@/types/locale";

/** Shipping and return figures come from the published policy texts. */
export const PDP_ASSURANCES: {
  icon: LucideIcon;
  title: LocaleCopy;
  detail: LocaleCopy;
}[] = [
  {
    icon: Truck,
    title: { fa: "ارسال امن", en: "Safe shipping" },
    detail: { fa: "رایگان و بیمه‌شده", en: "Free and insured" },
  },
  {
    icon: Fingerprint,
    title: { fa: "یک اثر", en: "One work" },
    detail: { fa: "فقط یک نسخه", en: "One of one" },
  },
  {
    icon: RotateCcw,
    title: { fa: "۴۸ ساعت", en: "48 hours" },
    detail: { fa: "فرصت بازگشت", en: "to ask for a return" },
  },
];
