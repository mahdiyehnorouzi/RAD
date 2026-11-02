import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { iranDivisionsPath, selectIranLocation } from "./addresses.locations";

const storefrontDataset = join(
  __dirname,
  "../../../storefront/lib/geo/iran-divisions.json",
);

test("the API divisions file is the storefront checkout dataset", () => {
  const hash = (file: string) =>
    createHash("sha256").update(readFileSync(file)).digest("hex");
  assert.equal(hash(iranDivisionsPath()), hash(storefrontDataset));
});

test("a province only accepts its own cities", () => {
  const file = JSON.parse(readFileSync(iranDivisionsPath(), "utf8")) as {
    provinces: Array<{
      id: string;
      label: string;
      cities: Array<{ id: string; label: string }>;
    }>;
  };
  const tehran = file.provinces.find((province) => province.label === "تهران");
  const alborz = file.provinces.find((province) => province.label === "البرز");
  assert.ok(tehran && alborz);
  const selected = selectIranLocation(tehran.id, tehran.cities[0].id);
  assert.equal(selected.ok, true);
  if (!selected.ok) return;
  assert.equal(selected.provinceLabel, "تهران");
  assert.equal(selected.cityLabel, tehran.cities[0].label);
  assert.deepEqual(selectIranLocation(tehran.id, ""), {
    ok: false,
    reason: "city",
  });
  assert.deepEqual(selectIranLocation(tehran.id, alborz.cities[0].id), {
    ok: false,
    reason: "mismatch",
  });
  assert.deepEqual(
    selectIranLocation("province:missing", tehran.cities[0].id),
    {
      ok: false,
      reason: "province",
    },
  );

  for (const province of file.provinces) {
    for (const city of province.cities) {
      const place = selectIranLocation(province.id, city.id);
      assert.equal(place.ok, true);
      if (!place.ok) continue;
      assert.equal(place.provinceLabel, province.label);
      assert.equal(place.cityLabel, city.label);
    }
  }
});
