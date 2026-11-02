import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import type { CustomerAddress } from "@rad/types";
import { IRAN_PROVINCES } from "../../lib/geo/iran-locations";
import {
  addressDraftDirty,
  addressPayload,
  draftFromAddress,
  initialAddressBookState,
  reduceAddressBook,
  type AddressBookAction,
} from "./address-book-state";
import type { AddressCopy } from "./type";

const copy: AddressCopy = {
  nameInvalid: "نام گیرنده را حداقل با ۲ نویسه بنویسید.",
  nameTooLong: "نام گیرنده نباید بیشتر از ۸۰ نویسه باشد.",
  phoneEmpty: "شماره موبایل گیرنده را بنویسید.",
  phoneInvalid: "شماره موبایل را با ۰۹ و یازده رقم بنویسید.",
  provinceInvalid: "استان گیرنده را انتخاب کنید.",
  cityInvalid: "شهر گیرنده را انتخاب کنید.",
  addressInvalid: "نشانی را کامل بنویسید تا بسته درست برسد.",
  addressTooLong: "نشانی نباید بیشتر از ۴۰۰ نویسه باشد.",
  postalInvalid: "کد پستی را با ۱۰ رقم بنویسید، یا خالی بگذارید.",
};

const tehran = IRAN_PROVINCES.find((province) => province.label === "تهران");
const alborz = IRAN_PROVINCES.find((province) => province.label === "البرز");
if (!tehran || !alborz) throw new Error("missing provinces");

function address(overrides: Partial<CustomerAddress> = {}): CustomerAddress {
  return {
    id: "addr-1",
    recipientName: "سارا محمدی",
    phone: "09121234567",
    provinceId: tehran!.id,
    cityId: tehran!.cities[0].id,
    provinceLabel: "تهران",
    cityLabel: tehran!.cities[0].label,
    address: "خیابان ولیعصر، پلاک ۱۲",
    postalCode: "1234567890",
    isDefault: true,
    ...overrides,
  };
}

function ready(addresses: CustomerAddress[]) {
  return reduceAddressBook(initialAddressBookState, {
    type: "loaded",
    addresses,
  });
}

function act(state: ReturnType<typeof ready>, action: AddressBookAction) {
  return reduceAddressBook(state, action);
}

test("an empty book is not the same state as a failed load", () => {
  const empty = ready([]);
  assert.equal(empty.phase, "ready");
  assert.equal(empty.addresses.length, 0);
  assert.equal(empty.notice, null);

  const failed = reduceAddressBook(initialAddressBookState, {
    type: "load-failed",
    text: "نشانی‌ها خوانده نشدند.",
  });
  assert.equal(failed.phase, "load-error");
  assert.equal(failed.notice?.tone, "error");
  const retried = act(failed, { type: "retry" });
  assert.equal(retried.phase, "loading");
  assert.equal(retried.notice, null);

  const reset = act(failed, { type: "reset" });
  assert.equal(reset.phase, "loading");
  assert.equal(reset.notice, null);
  assert.equal(reset.addresses.length, 0);
});

test("a short address blocks save and keeps what was typed", () => {
  let state = act(ready([]), { type: "create" });
  state = act(state, {
    type: "draft",
    field: "recipientName",
    value: "سارا محمدی",
  });
  state = act(state, { type: "draft", field: "phone", value: "09121234567" });
  state = act(state, { type: "province", provinceId: tehran!.id });
  state = act(state, {
    type: "draft",
    field: "cityId",
    value: tehran!.cities[0].id,
  });
  state = act(state, { type: "draft", field: "address", value: "کوتاه" });
  const submitted = act(state, { type: "submit", copy });
  assert.equal(submitted.phase, "ready");
  assert.equal(submitted.errors.address, copy.addressInvalid);
  assert.equal(submitted.draft.address, "کوتاه");
});

test("changing the province clears the city, and a valid draft becomes a checkout-shaped payload", () => {
  let state = act(ready([]), { type: "create" });
  state = act(state, { type: "province", provinceId: tehran!.id });
  state = act(state, {
    type: "draft",
    field: "cityId",
    value: tehran!.cities[0].id,
  });
  state = act(state, { type: "province", provinceId: alborz!.id });
  assert.equal(state.draft.provinceId, alborz!.id);
  assert.equal(state.draft.cityId, "");

  state = act(state, { type: "province", provinceId: tehran!.id });
  state = act(state, {
    type: "draft",
    field: "cityId",
    value: tehran!.cities[0].id,
  });
  state = act(state, {
    type: "draft",
    field: "recipientName",
    value: "  سارا   محمدی ",
  });
  state = act(state, { type: "draft", field: "phone", value: "۰۹۱۲۱۲۳۴۵۶۷" });
  state = act(state, {
    type: "draft",
    field: "address",
    value: "خیابان ولیعصر، پلاک ۱۲",
  });
  state = act(state, {
    type: "draft",
    field: "postalCode",
    value: "۱۲۳۴۵۶۷۸۹۰",
  });
  const submitted = act(state, { type: "submit", copy });
  assert.equal(submitted.phase, "saving");
  assert.deepEqual(addressPayload(submitted.draft, "create"), {
    recipientName: "سارا محمدی",
    phone: "09121234567",
    provinceId: tehran!.id,
    cityId: tehran!.cities[0].id,
    address: "خیابان ولیعصر، پلاک ۱۲",
    postalCode: "1234567890",
    isDefault: true,
  });
  assert.equal("userId" in addressPayload(submitted.draft, "create"), false);
});

test("delete waits for confirmation, and a successful save replaces the list", () => {
  const first = address();
  const second = address({
    id: "addr-2",
    recipientName: "لیلا احمدی",
    isDefault: false,
  });
  let state = ready([first, second]);
  const ignored = act(state, { type: "confirm-delete" });
  assert.equal(ignored.phase, "ready");
  assert.equal(ignored.addresses.length, 2);

  state = act(state, { type: "ask-delete", id: second.id });
  assert.equal(state.view, "delete");
  assert.equal(state.addresses.length, 2);
  state = act(state, { type: "cancel" });
  assert.equal(state.view, "list");

  state = act(state, { type: "ask-delete", id: second.id });
  state = act(state, { type: "confirm-delete" });
  assert.equal(state.phase, "deleting");
  const failed = act(state, { type: "delete-failed", text: "حذف انجام نشد." });
  assert.equal(failed.phase, "ready");
  assert.equal(failed.view, "delete");
  assert.equal(failed.notice?.tone, "error");

  const saved = address({ id: "addr-3", recipientName: "نسترن کریمی" });
  const edited = act(ready([first]), { type: "edit", address: first });
  assert.equal(addressDraftDirty(edited), false);
  const dirty = act(edited, {
    type: "draft",
    field: "recipientName",
    value: "سارا رضایی",
  });
  assert.equal(addressDraftDirty(dirty), true);
  const afterSave = act(dirty, {
    type: "saved",
    addresses: [saved],
    text: "نشانی به‌روز شد.",
  });
  assert.equal(afterSave.view, "list");
  assert.equal(afterSave.addresses.length, 1);
  assert.equal(afterSave.addresses[0].recipientName, "نسترن کریمی");
  assert.equal(afterSave.notice?.tone, "success");
  assert.deepEqual(draftFromAddress(first).provinceId, first.provinceId);
});

test("the twenty-first address cannot be started from the list", () => {
  const addresses = Array.from({ length: 20 }, (_, index) =>
    address({ id: `addr-${index}`, isDefault: index === 0 }),
  );
  const state = act(ready(addresses), { type: "create" });
  assert.equal(state.view, "list");
});

test("address book layout keeps phone and postal fields left-to-right and stacks actions on a phone", () => {
  const root = dirname(fileURLToPath(import.meta.url));
  const form = readFileSync(
    join(root, "address-book/address-form.module.css"),
    "utf8",
  );
  const card = readFileSync(
    join(root, "address-book/address-card.module.css"),
    "utf8",
  );
  const dialog = readFileSync(
    join(root, "address-book/address-delete-dialog.module.css"),
    "utf8",
  );
  assert.match(
    form,
    /:global\(html\[dir="rtl"\]\) \.ltr[\s\S]*direction:\s*ltr/,
  );
  assert.match(form, /@media \(--phone\)[\s\S]*width:\s*100%/);
  assert.match(card, /@media \(--phone\)[\s\S]*width:\s*100%/);
  assert.match(dialog, /safe-area-inset-bottom/);
  assert.match(dialog, /role|dialog::backdrop/);
});
