import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Same Iranian Post divisions checkout uses
 * (`apps/storefront/lib/geo/iran-divisions.json`). This file is a byte copy
 * so the API artifact can validate province/city pairs without shipping the
 * storefront. `addresses.locations.spec.ts` fails if the two files diverge.
 *
 * The running API looks beside this module (tsx) and, after `nest build`,
 * in the packaged `src` tree (`dist/addresses` -> `src/addresses`).
 */
type DivisionCity = { id: string; label: string };
type DivisionProvince = {
  id: string;
  label: string;
  cities: DivisionCity[];
};

export type IranLocation =
  | {
      ok: true;
      provinceId: string;
      cityId: string;
      provinceLabel: string;
      cityLabel: string;
    }
  | { ok: false; reason: "province" | "city" | "mismatch" };

let provinces: DivisionProvince[] | null = null;

export function iranDivisionsPath() {
  const candidates = [
    join(__dirname, "iran-divisions.json"),
    join(__dirname, "../../src/addresses/iran-divisions.json"),
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error("Iran address divisions dataset is missing.");
  }
  return found;
}

function loadProvinces() {
  if (provinces) return provinces;
  const file = JSON.parse(readFileSync(iranDivisionsPath(), "utf8")) as {
    provinces: DivisionProvince[];
  };
  provinces = file.provinces;
  return provinces;
}

/** Same pair rule as `locationSelection` in the storefront. */
export function selectIranLocation(
  provinceId: string,
  cityId: string,
): IranLocation {
  const province = loadProvinces().find((item) => item.id === provinceId);
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
  };
}
