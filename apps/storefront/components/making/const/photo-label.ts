import type { LocaleCopy } from "@/types/locale";
import type { PhotoKind } from "@/components/making/type";

export const photoLabel: Record<PhotoKind, LocaleCopy> = {
  concept: { fa: "تصویر نیت", en: "Intention image" },
  forming: { fa: "فرم‌دهی", en: "Forming" },
  cleaned: { fa: "فرم پاک‌شده", en: "Cleaned form" },
  glaze: { fa: "مرجع لعاب", en: "Glaze reference" },
  tile: { fa: "کاشی آزمایشی", en: "Test tile" },
  fired: { fa: "پس از پخت", en: "After firing" },
  finished: { fa: "تمام‌شده", en: "Finished" },
  packed: { fa: "بسته‌بندی", en: "Packed" },
};
