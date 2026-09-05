import type {ProductCategory, ProductVisual} from "@rad/types";
import type {LocaleCopy} from "@/types/locale";
import type { DifferencePortrait, SurprisePermission } from "@/components/difference/type";

const artistTemplates: Record<
  SurprisePermission,
  LocaleCopy[]
> = {
  faithful: [
    {
      fa: "سیاه‌قلم شما را نگه داشتم؛ فقط دیواره را برای ساخت ضخیم‌تر کردم.",
      en: "I kept your silhouette; I only thickened the wall so it could be made.",
    },
    {
      fa: "نسبت دهانه را یک بند انگشت تغییر دادم تا روی میز نلرزد.",
      en: "I shifted the rim by a finger’s width so it would sit without wobble.",
    },
  ],
  hand: [
    {
      fa: "این منحنی را برای تعادل تغییر دادم.",
      en: "I changed this curve for balance.",
    },
    {
      fa: "تقارن کامل را برداشتم؛ دست باید جایی برای ورود داشته باشد.",
      en: "I removed perfect symmetry so the hand would have a place to enter.",
    },
  ],
  material: [
    {
      fa: "لبه را باز گذاشتم تا دو سانتی‌متر آخر را کوره تصمیم بگیرد.",
      en: "I left the rim open so the kiln could decide the last two centimetres.",
    },
    {
      fa: "لعاب را ناهموار مالیدم؛ یکنواختی اینجا دروغ می‌گفت.",
      en: "I applied the glaze unevenly—uniformity would have been a lie here.",
    },
  ],
};

const materialTemplates: Record<SurprisePermission, LocaleCopy[]> = {
  faithful: [
    {
      fa: "رنگ نهایی نیم‌پرده گرم‌تر از تصویر درآمد.",
      en: "The finished colour came half a shade warmer than the image.",
    },
  ],
  hand: [
    {
      fa: "لعاب اینجا حرکت کرد.",
      en: "The glaze moved here.",
    },
    {
      fa: "اثر انگشت روی شانه باقی ماند و آن را پاک نکردم.",
      en: "A fingerprint stayed on the shoulder; I did not wipe it away.",
    },
  ],
  material: [
    {
      fa: "کوره این رنگ غیرمنتظره را ساخت.",
      en: "The kiln created this unexpected colour.",
    },
    {
      fa: "ترک ظریف سطحی بخشی از پوست اثر شد، نه یک خطا.",
      en: "A fine surface crack became skin, not a fault.",
    },
  ],
};

export function composeLivePortrait(input: {
  prompt: string;
  category: ProductCategory;
  visual: ProductVisual;
  permission: SurprisePermission;
  color: string;
  accent: string;
}): DifferencePortrait {
  const stamp = Date.now().toString().slice(-3);
  return {
    id: `live-${stamp}`,
    code: `RAD / ${stamp.padStart(3, "0")}`,
    year: "2026",
    permission: input.permission,
    category: input.category,
    visual: input.visual,
    maker: { fa: "کارگاه رَد، تهران", en: "RAD workshop, Tehran" },
    described: { fa: input.prompt, en: input.prompt },
    imaginedNote: {
      fa: "این تصویر نیت است، نه شیء.",
      en: "This image is intention, not the object.",
    },
    artistNotes: artistTemplates[input.permission],
    materialNotes: materialTemplates[input.permission],
    fingerprint: {
      clay: {
        fa: input.category === "textile" ? "الیاف انتخاب‌شده در کارگاه" : "خاک رس کارگاه تهران",
        en: input.category === "textile" ? "Fibres chosen in the workshop" : "Tehran studio clay",
      },
      glaze: {
        fa: "رفتار سطح وابسته به اجازه غافلگیری شما",
        en: "Surface behaviour follows your permission for surprise",
      },
      firing: {
        fa: input.permission === "material" ? "احیا، مسیر باز برای غافلگیری" : "پخت کنترل‌شده با جای کمی برای ماده",
        en: input.permission === "material" ? "Reduction, path left open for surprise" : "Controlled firing with a little room for material",
      },
      irregularity: {
        fa: "نامنظمی‌های مرئی پس از ساخت ثبت می‌شوند.",
        en: "Visible irregularities are recorded after making.",
      },
    },
    palette: {
      described: { color: "#cbb892", accent: input.accent },
      imagined: { color: input.color, accent: input.accent },
      artist: { color: input.color, accent: "#d8c4a0" },
      material: {
        color: input.permission === "material" ? "#4b513c" : input.color,
        accent: input.permission === "faithful" ? input.accent : "#dbc7a5",
      },
    },
  };
}
