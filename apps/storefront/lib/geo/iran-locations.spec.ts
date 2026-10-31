import assert from "node:assert/strict";
import { test } from "node:test";
import {
  IRAN_DIVISIONS_SOURCE,
  IRAN_PROVINCES,
  cityAfterProvinceChange,
  citiesInProvince,
  locationSelection,
  restoreCheckoutLocation,
  type IranCity,
  type IranProvince,
  type LocationSelection,
} from "./iran-locations";

const OFFICIAL = [
  "آذربایجان شرقی",
  "آذربایجان غربی",
  "اردبیل",
  "اصفهان",
  "البرز",
  "ایلام",
  "بوشهر",
  "تهران",
  "چهارمحال و بختیاری",
  "خراسان جنوبی",
  "خراسان رضوی",
  "خراسان شمالی",
  "خوزستان",
  "زنجان",
  "سمنان",
  "سیستان و بلوچستان",
  "فارس",
  "قزوین",
  "قم",
  "کردستان",
  "کرمان",
  "کرمانشاه",
  "کهگیلویه و بویراحمد",
  "گلستان",
  "گیلان",
  "لرستان",
  "مازندران",
  "مرکزی",
  "هرمزگان",
  "همدان",
  "یزد",
];

function isProvince(value: IranProvince) {
  const city: IranCity | undefined = value.cities[0];
  return Boolean(value.id && value.label && city?.id && city.label);
}

test("the dataset is the 2025-01-18 Iranian Post snapshot of all 31 provinces", () => {
  assert.equal(IRAN_DIVISIONS_SOURCE.snapshot, "2025-01-18");
  assert.equal(IRAN_DIVISIONS_SOURCE.commit, "ef80f5bab604");
  assert.equal(IRAN_PROVINCES.length, 31);
  assert.equal(IRAN_PROVINCES.every(isProvince), true);
  assert.deepEqual(
    IRAN_PROVINCES.map((province) => province.label),
    OFFICIAL,
  );
  const ids = new Set<string>();
  let cities = 0;
  for (const province of IRAN_PROVINCES) {
    assert.equal(ids.has(province.id), false, province.label);
    ids.add(province.id);
    assert.ok(province.cities.length > 0, province.label);
    for (const city of province.cities) {
      assert.equal(ids.has(city.id), false, city.label);
      ids.add(city.id);
      cities += 1;
    }
  }
  assert.ok(cities > 400, `expected a full city list, got ${cities}`);
});

test("cities follow the selected province and reject a mismatched pair", () => {
  const tehran = IRAN_PROVINCES.find((province) => province.label === "تهران");
  const alborz = IRAN_PROVINCES.find((province) => province.label === "البرز");
  assert.ok(tehran && alborz);
  const tehranCity = tehran.cities.find((city) => city.label === "تهران");
  const karaj = alborz.cities.find((city) => city.label === "کرج");
  assert.ok(tehranCity && karaj);
  assert.equal(
    citiesInProvince(tehran.id).some((city) => city.id === karaj.id),
    false,
  );
  assert.equal(locationSelection(alborz.id, karaj.id).ok, true);
  const wrong: LocationSelection = locationSelection(tehran.id, karaj.id);
  assert.deepEqual(wrong, { ok: false, reason: "mismatch" });
  const selected = locationSelection(alborz.id, karaj.id);
  assert.equal(selected.ok && selected.snapshot, "البرز، کرج");
});

test("the city clears only when the province actually changes", () => {
  const tehran = IRAN_PROVINCES.find((province) => province.label === "تهران");
  const alborz = IRAN_PROVINCES.find((province) => province.label === "البرز");
  assert.ok(tehran && alborz);
  const cityId = tehran.cities[0]?.id ?? "";
  assert.equal(cityAfterProvinceChange(tehran.id, tehran.id, cityId), cityId);
  assert.equal(cityAfterProvinceChange(tehran.id, alborz.id, cityId), "");
});

test("back navigation keeps a valid pair and does not guess an ambiguous legacy city", () => {
  const alborz = IRAN_PROVINCES.find((province) => province.label === "البرز");
  assert.ok(alborz);
  const karaj = alborz.cities.find((city) => city.label === "کرج");
  assert.ok(karaj);
  assert.deepEqual(
    restoreCheckoutLocation({ provinceId: alborz.id, cityId: karaj.id }),
    { provinceId: alborz.id, cityId: karaj.id },
  );
  assert.deepEqual(
    restoreCheckoutLocation({ provinceId: alborz.id, cityId: "missing" }),
    { provinceId: alborz.id, cityId: "" },
  );

  const labels = new Map<string, number>();
  for (const province of IRAN_PROVINCES) {
    for (const city of province.cities) {
      labels.set(city.label, (labels.get(city.label) ?? 0) + 1);
    }
  }
  const ambiguous = [...labels.entries()].find(([, count]) => count > 1);
  assert.ok(ambiguous, "the dataset should contain a repeated city name");
  assert.deepEqual(restoreCheckoutLocation({ city: ambiguous[0] }), {
    provinceId: "",
    cityId: "",
  });
  assert.deepEqual(restoreCheckoutLocation({ city: "کرج" }), {
    provinceId: alborz.id,
    cityId: karaj.id,
  });
});
