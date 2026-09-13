import type { LocaleCopy } from "@/types/locale";
import { findPassport, radPassports } from "./passports";

function copy(fa: string, en: string): LocaleCopy {
  return { fa, en };
}

export type FamilyLink = {
  from: string;
  to: string;
  note: LocaleCopy;
};

export type RadFamily = {
  id: string;
  name: LocaleCopy;
  codes: string[];
  links: FamilyLink[];
};

export const radFamilies: RadFamily[] = [
  {
    id: "kaj-dasteh",
    name: copy("خانواده کج‌دسته‌ها", "The crooked-handle family"),
    codes: ["017", "007", "031"],
    links: [
      {
        from: "017",
        to: "007",
        note: copy("الهام از همان کجی", "Inspired by that same lean"),
      },
      {
        from: "007",
        to: "031",
        note: copy("آزمایش رنگ روی همان دسته", "A colour experiment on the same handle"),
      },
    ],
  },
  {
    id: "haleh",
    name: copy("خانواده هاله", "The halo family"),
    codes: ["029"],
    links: [],
  },
  {
    id: "kiln",
    name: copy("خانواده اتفاق‌های کوره", "The kiln-accident family"),
    codes: ["041", "044"],
    links: [
      {
        from: "041",
        to: "044",
        note: copy("شکست رنگ کوره، مسیر دیگری شد", "A kiln colour-break became another path"),
      },
    ],
  },
];

export function familyForCode(code: string) {
  return radFamilies.find((family) => family.codes.includes(code));
}

export function familyMembers(code: string) {
  const family = familyForCode(code);
  if (!family) return [];
  return family.codes
    .map((item) => findPassport(item))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export function relatedByFeeling(code: string, limit = 3) {
  const current = findPassport(code);
  if (!current?.traits) {
    return radPassports.filter((item) => item.code !== code && item.sold).slice(0, limit);
  }
  return radPassports
    .filter((item) => item.code !== code && item.traits)
    .map((item) => ({
      item,
      distance: traitDistance(current.traits!, item.traits!),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function traitDistance(
  a: NonNullable<ReturnType<typeof findPassport>>["traits"],
  b: NonNullable<ReturnType<typeof findPassport>>["traits"],
) {
  if (!a || !b) return 99;
  return (
    Math.abs(a.crooked - b.crooked) +
    Math.abs(a.quiet - b.quiet) +
    Math.abs(a.worn - b.worn) +
    Math.abs(a.surprise - b.surprise) +
    Math.abs(a.strange - b.strange)
  );
}
