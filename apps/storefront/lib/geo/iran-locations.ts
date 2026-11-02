/**
 * Iran's provinces and their cities, for checkout now and for custom orders
 * and artist collaboration later. Those forms still use their own lists.
 *
 * Dataset: Iranian Post address divisions (GNAF), snapshot 2025-01-18,
 * commit ef80f5bab604 of masterking32/iran-states-cities-districts (MIT).
 * https://github.com/masterking32/iran-states-cities-districts
 * Upstream: https://post.ir
 * Places are Post cities plus county centers. Centers such as تهران and کرج
 * exist only as counties in that feed, so both are included. Villages are not.
 *
 * Stored ids are `province:`, `city:`, or `county:` plus the Post id.
 * Labels are Persian. The order snapshot keeps
 * a Persian "province، city" string in the existing city column, so older
 * orders that only have a city name still display as saved.
 */
import divisions from "./iran-divisions.json";

export const IRAN_DIVISIONS_SOURCE = divisions.source;

export type IranCity = {
  id: string;
  label: string;
};

export type IranProvince = {
  id: string;
  label: string;
  cities: readonly IranCity[];
};

export const IRAN_PROVINCES: readonly IranProvince[] = divisions.provinces;

const provinceById = new Map(
  IRAN_PROVINCES.map((province) => [province.id, province]),
);

export function citiesInProvince(provinceId: string): readonly IranCity[] {
  return provinceById.get(provinceId)?.cities ?? [];
}

export type LocationSelection =
  | {
      ok: true;
      provinceId: string;
      cityId: string;
      provinceLabel: string;
      cityLabel: string;
      /** Persian snapshot stored on the existing order city column. */
      snapshot: string;
    }
  | { ok: false; reason: "province" | "city" | "mismatch" };

export function locationSelection(
  provinceId: string,
  cityId: string,
): LocationSelection {
  const province = provinceById.get(provinceId);
  if (!province) return { ok: false, reason: "province" };
  const city = province.cities.find((item) => item.id === cityId);
  if (!city) {
    return { ok: false, reason: cityId ? "mismatch" : "city" };
  }
  return {
    ok: true,
    provinceId: province.id,
    cityId: city.id,
    provinceLabel: province.label,
    cityLabel: city.label,
    snapshot: `${province.label}، ${city.label}`,
  };
}

/** Clearing the city is tied to a real province change, not a re-render. */
export function cityAfterProvinceChange(
  previousProvinceId: string,
  nextProvinceId: string,
  cityId: string,
) {
  if (previousProvinceId === nextProvinceId) return cityId;
  return "";
}

/**
 * Restores a checkout draft. Ids win. A legacy free-text city is restored
 * only when that label belongs to exactly one city in the dataset.
 */
export function restoreCheckoutLocation(draft: {
  provinceId?: string;
  cityId?: string;
  city?: string;
}) {
  const provinceId = draft.provinceId?.trim() ?? "";
  const cityId = draft.cityId?.trim() ?? "";
  if (provinceById.has(provinceId)) {
    const selected = locationSelection(provinceId, cityId);
    return {
      provinceId,
      cityId: selected.ok ? selected.cityId : "",
    };
  }

  const label = draft.city?.trim() ?? "";
  if (!label || label.includes("،")) return { provinceId: "", cityId: "" };
  const matches = IRAN_PROVINCES.flatMap((province) =>
    province.cities
      .filter((city) => city.label === label)
      .map((city) => ({ provinceId: province.id, cityId: city.id })),
  );
  if (matches.length !== 1) return { provinceId: "", cityId: "" };
  return matches[0];
}
