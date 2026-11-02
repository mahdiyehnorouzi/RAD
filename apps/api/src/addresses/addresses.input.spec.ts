import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { iranDivisionsPath } from "./addresses.locations";
import { parseAddressInput } from "./addresses.input";

const divisions = JSON.parse(readFileSync(iranDivisionsPath(), "utf8")) as {
  provinces: Array<{
    id: string;
    label: string;
    cities: Array<{ id: string }>;
  }>;
};
const tehran = divisions.provinces.find(
  (province) => province.label === "تهران",
);
const alborz = divisions.provinces.find(
  (province) => province.label === "البرز",
);
if (!tehran || !alborz) throw new Error("missing provinces");

const valid = {
  recipientName: "  سارا   محمدی ",
  phone: "۰۹۱۲۱۲۳۴۵۶۷",
  provinceId: tehran.id,
  cityId: tehran.cities[0].id,
  address: "  خیابان ولیعصر، پلاک ۱۲  ",
  postalCode: "۱۲۳۴۵-۶۷۸۹۰",
};

test("a checkout-shaped address is stored in canonical form", () => {
  const parsed = parseAddressInput(valid);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.value.recipientName, "سارا محمدی");
  assert.equal(parsed.value.phone, "09121234567");
  assert.equal(parsed.value.provinceLabel, "تهران");
  assert.equal(parsed.value.address, "خیابان ولیعصر، پلاک ۱۲");
  assert.equal(parsed.value.postalCode, "1234567890");
  assert.equal(parsed.value.cityId, tehran.cities[0].id);
});

test("an empty postal code is saved as null", () => {
  const parsed = parseAddressInput({ ...valid, postalCode: "  " });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.value.postalCode, null);
});

test("validation rejects a short street, a bad mobile, a short postal code, and a city from another province", () => {
  const street = parseAddressInput({ ...valid, address: "کوتاه" });
  assert.equal(street.ok, false);
  if (!street.ok) assert.equal(street.code, "address_invalid");

  const phone = parseAddressInput({ ...valid, phone: "02112345678" });
  assert.equal(phone.ok, false);
  if (!phone.ok) assert.equal(phone.code, "phone_invalid");

  const postal = parseAddressInput({ ...valid, postalCode: "12345" });
  assert.equal(postal.ok, false);
  if (!postal.ok) assert.equal(postal.code, "postal_invalid");

  const mismatch = parseAddressInput({
    ...valid,
    cityId: alborz.cities[0].id,
  });
  assert.equal(mismatch.ok, false);
  if (!mismatch.ok) assert.equal(mismatch.code, "city_mismatch");

  const province = parseAddressInput({ ...valid, provinceId: "" });
  assert.equal(province.ok, false);
  if (!province.ok) assert.equal(province.code, "province_invalid");
});
