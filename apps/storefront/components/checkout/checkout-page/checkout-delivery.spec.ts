import assert from "node:assert/strict";
import { test } from "node:test";
import type { CustomerAddress } from "@rad/types";
import { ApiError } from "@/lib/api";
import { IRAN_PROVINCES } from "@/lib/geo/iran-locations";
import { canonicalIranMobile } from "@/lib/phone/iran-mobile";
import {
  addressChoiceOf,
  checkoutAddressLoadStatus,
  defaultAddressToApply,
  deliveryFromSaved,
  draftBlocksDefault,
  orderAddressSnapshot,
  orderCitySnapshot,
  sameDelivery,
  validPostalOrEmpty,
  type CheckoutDraft,
  type DeliveryFields,
} from "./checkout-delivery";

const alborz = IRAN_PROVINCES.find((province) => province.label === "البرز");
const karaj = alborz?.cities.find((city) => city.label === "کرج");
const tehran = IRAN_PROVINCES.find((province) => province.label === "تهران");
const tehranCity = tehran?.cities.find((city) => city.label === "تهران");

function address(
  patch: Partial<CustomerAddress> & Pick<CustomerAddress, "id">,
): CustomerAddress {
  return {
    recipientName: "نگار راد",
    phone: "09121234567",
    provinceId: alborz?.id ?? "",
    cityId: karaj?.id ?? "",
    provinceLabel: "البرز",
    cityLabel: "کرج",
    address: "خیابان آزمایش ۱۲",
    postalCode: "1234567890",
    isDefault: false,
    ...patch,
  };
}

const home = address({
  id: "home",
  isDefault: false,
  address: "خیابان خانه ۱۲",
});
const work = address({
  id: "work",
  isDefault: true,
  recipientName: "دفتر راد",
  address: "خیابان کار ۳۴",
  postalCode: null,
  provinceId: tehran?.id ?? "",
  cityId: tehranCity?.id ?? "",
  provinceLabel: "تهران",
  cityLabel: "تهران",
});

test("a customer with no saved addresses is not given a preselection", () => {
  assert.equal(defaultAddressToApply({}, []), null);
});

test("one saved default address is the preselection when nothing has been entered", () => {
  assert.equal(defaultAddressToApply({}, [work])?.id, "work");
});

test("several addresses preselect only the default", () => {
  assert.equal(defaultAddressToApply({}, [home, work])?.id, "work");
  assert.equal(defaultAddressToApply({}, [work, home])?.id, "work");
});

test("an existing delivery draft is kept, including one the buyer then cleared", () => {
  const typed: CheckoutDraft = {
    name: "از پیش‌نویس",
    phone: "09120000000",
    provinceId: alborz?.id,
    cityId: karaj?.id,
    address: "خیابان ولیعصر ۱۲",
    postalCode: "1234567890",
  };
  assert.equal(draftBlocksDefault(typed), true);
  assert.equal(defaultAddressToApply(typed, [home, work]), null);
  assert.equal(
    defaultAddressToApply(
      {
        name: "",
        phone: "",
        provinceId: "",
        cityId: "",
        address: "",
        postalCode: "",
      },
      [work],
    ),
    null,
  );
});

test("an explicit manual or saved choice is not replaced by the default", () => {
  assert.equal(
    defaultAddressToApply({ addressChoice: "manual" }, [home, work]),
    null,
  );
  assert.equal(
    defaultAddressToApply({ addressChoice: "saved", savedAddressId: "home" }, [
      home,
      work,
    ]),
    null,
  );
  assert.equal(addressChoiceOf({ addressChoice: "saved" }), "saved");
});

test("switching addresses copies that card onto the order and leaves the record untouched", () => {
  const before = home.address;
  const fields = deliveryFromSaved(home);
  fields.address = "ویرایش شده برای همین سفارش ۱۲";
  assert.equal(home.address, before);
  assert.equal(sameDelivery(fields, home), false);
  assert.equal(sameDelivery(deliveryFromSaved(work), work), true);
  assert.notEqual(
    deliveryFromSaved(home).address,
    deliveryFromSaved(work).address,
  );
});

test("a selected saved address is the order payload and carries no address id", () => {
  assert.ok(alborz && karaj);
  const fields = deliveryFromSaved(home);
  const postal = validPostalOrEmpty(fields.postalCode);
  assert.equal(postal.ok, true);
  if (!postal.ok) return;
  const payload = {
    name: fields.name.trim(),
    phone: canonicalIranMobile(fields.phone),
    city: orderCitySnapshot(fields.provinceId, fields.cityId),
    address: orderAddressSnapshot(
      fields.address,
      postal.postal,
      "کد پستی",
      "fa",
    ),
  };
  assert.deepEqual(payload, {
    name: "نگار راد",
    phone: "09121234567",
    city: "البرز، کرج",
    address: "خیابان خانه ۱۲، کد پستی 1234567890",
  });
  assert.equal("customerAddressId" in payload, false);
  assert.equal(sameDelivery(fields, home), true);
});

test("guest checkout still builds a name, city, and address snapshot", () => {
  assert.ok(alborz && karaj);
  const city = orderCitySnapshot(alborz.id, karaj.id);
  const street = orderAddressSnapshot("خیابان مهمان ۱۲", "", "کد پستی", "fa");
  const snapshot = {
    name: "مهمان",
    phone: "09120000000",
    city,
    address: street,
  };
  assert.deepEqual(snapshot, {
    name: "مهمان",
    phone: "09120000000",
    city: "البرز، کرج",
    address: "خیابان مهمان ۱۲",
  });
  assert.equal("customerAddressId" in snapshot, false);
});

test("the order city is province، city and the address keeps a 10-digit postal suffix", () => {
  assert.ok(tehran && tehranCity);
  assert.equal(orderCitySnapshot(tehran.id, tehranCity.id), "تهران، تهران");
  assert.deepEqual(validPostalOrEmpty("۱۲۳۴۵-۶۷۸۹۰"), {
    ok: true,
    postal: "1234567890",
  });
  assert.deepEqual(validPostalOrEmpty(""), { ok: true, postal: "" });
  assert.deepEqual(validPostalOrEmpty("123"), { ok: false });
  assert.equal(
    orderAddressSnapshot("خیابان کار ۳۴", "1234567890", "کد پستی", "fa"),
    "خیابان کار ۳۴، کد پستی 1234567890",
  );
  assert.equal(
    orderAddressSnapshot("Valiasr 12", "1234567890", "Postal code", "en"),
    "Valiasr 12, Postal code 1234567890",
  );
});

test("a failed address load is separate from an expired session", () => {
  assert.equal(
    checkoutAddressLoadStatus(
      new ApiError("نشست تمام شد", 401, "auth_required"),
    ),
    "expired",
  );
  assert.equal(checkoutAddressLoadStatus(new ApiError("خطا", 500)), "error");
  assert.equal(checkoutAddressLoadStatus(new Error("offline")), "error");
});

test("delivery fields for a saved address are a copy the order can edit", () => {
  const fields: DeliveryFields = deliveryFromSaved(work);
  assert.equal(fields.provinceId, tehran?.id);
  assert.equal(fields.postalCode, "");
  assert.equal(fields.name, "دفتر راد");
});
