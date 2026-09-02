import type {LocaleCopy} from "@/types/locale";

export function asCopy(value: string): LocaleCopy {
  return { fa: value, en: value };
}

export function formatWhen(value: number, locale: "fa" | "en") {
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    dateStyle: "medium",
  }).format(value);
}
