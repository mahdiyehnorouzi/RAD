import { artworkFamilies } from "@rad/artworks";
import { formatRadCode } from "@rad/types";
import type { PassportTraits, RadPassport } from "@/components/passport/type";
import { findPassport } from "./passports";

export function familyForCode(code: string) {
  return artworkFamilies.find((family) =>
    family.members.some((member) => formatRadCode(member) === code),
  );
}

/** Members in the order the family grew; each carries its own `inspiredNote` link. */
export function familyMembers(passports: RadPassport[], code: string) {
  const family = familyForCode(code);
  if (!family) return [];
  return family.members
    .map((member) => findPassport(passports, member))
    .filter((item): item is RadPassport => Boolean(item));
}

export function relatedByFeeling(
  passports: RadPassport[],
  code: string,
  limit = 3,
) {
  const current = findPassport(passports, code);
  if (!current?.traits) {
    return passports.filter((item) => item.code !== code).slice(0, limit);
  }
  return passports
    .filter((item) => item.code !== code && item.traits)
    .map((item) => ({
      item,
      distance: traitDistance(current.traits, item.traits),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function traitDistance(a?: PassportTraits, b?: PassportTraits) {
  if (!a || !b) return 99;
  return (
    Math.abs(a.crooked - b.crooked) +
    Math.abs(a.quiet - b.quiet) +
    Math.abs(a.worn - b.worn) +
    Math.abs(a.surprise - b.surprise) +
    Math.abs(a.strange - b.strange)
  );
}
