import assert from "node:assert/strict";
import { test } from "node:test";
import {
  initialProfileState,
  profileIsDirty,
  profileUpdatePayload,
  reduceProfileForm,
  type ProfileCopy,
  type ProfileUser,
} from "./profile-form";

const copy: ProfileCopy = {
  nameInvalid: "نام باید حداقل ۲ نویسه باشد.",
  nameTooLong: "نام نباید بیشتر از ۸۰ نویسه باشد.",
  phoneInvalid: "شماره موبایل ایرانی معتبر وارد کنید.",
};

const user: ProfileUser = {
  name: "سارا محمدی",
  email: "sara@example.com",
  phone: "09121234567",
};

test("loading an account fills the form from the saved profile and keeps email out of the payload", () => {
  const state = initialProfileState(user);
  assert.equal(state.draft.name, "سارا محمدی");
  assert.equal(state.draft.phone, "0912 123 4567");
  assert.equal(profileIsDirty(state), false);
  const payload = profileUpdatePayload(state.draft);
  assert.deepEqual(payload, { name: "سارا محمدی", phone: "09121234567" });
  assert.equal("email" in payload, false);
});

test("Persian and Arabic digits become a canonical mobile on save", () => {
  const state = reduceProfileForm(
    initialProfileState({ ...user, phone: null }),
    {
      type: "edit",
      field: "phone",
      value: "۰۹۱۲۱۲۳۴۵۶۷",
    },
  );
  const submitted = reduceProfileForm(state, { type: "submit", copy });
  assert.equal(submitted.phase, "saving");
  assert.deepEqual(profileUpdatePayload(submitted.draft), {
    name: "سارا محمدی",
    phone: "09121234567",
  });
});

test("an invalid phone blocks submit and keeps what was typed", () => {
  const edited = reduceProfileForm(initialProfileState(user), {
    type: "edit",
    field: "phone",
    value: "0211234",
  });
  const submitted = reduceProfileForm(edited, { type: "submit", copy });
  assert.equal(submitted.phase, "error");
  assert.equal(submitted.errors.phone, copy.phoneInvalid);
  assert.equal(submitted.draft.phone, "0211234");
});

test("a successful save refreshes the displayed name and phone", () => {
  let state = reduceProfileForm(initialProfileState(user), {
    type: "edit",
    field: "name",
    value: "نسترن کریمی",
  });
  state = reduceProfileForm(state, { type: "submit", copy });
  state = reduceProfileForm(state, {
    type: "success",
    user: { ...user, name: "نسترن کریمی", phone: "09121234567" },
  });
  assert.equal(state.phase, "saved");
  assert.equal(state.draft.name, "نسترن کریمی");
  assert.equal(profileIsDirty(state), false);
  state = reduceProfileForm(state, {
    type: "user",
    user: { ...user, name: "نسترن کریمی", phone: "09121234567" },
  });
  assert.equal(state.draft.name, "نسترن کریمی");
});

test("an API failure keeps the unsaved draft", () => {
  let state = reduceProfileForm(initialProfileState(user), {
    type: "edit",
    field: "name",
    value: "نسترن کریمی",
  });
  state = reduceProfileForm(state, { type: "submit", copy });
  state = reduceProfileForm(state, {
    type: "failure",
    message: "ذخیره انجام نشد.",
  });
  assert.equal(state.phase, "error");
  assert.equal(state.message, "ذخیره انجام نشد.");
  assert.equal(state.draft.name, "نسترن کریمی");
  assert.equal(state.saved.name, "سارا محمدی");
});

test("a second submit while saving is ignored", () => {
  let state = reduceProfileForm(initialProfileState(user), {
    type: "edit",
    field: "name",
    value: "نسترن کریمی",
  });
  state = reduceProfileForm(state, { type: "submit", copy });
  const again = reduceProfileForm(state, { type: "submit", copy });
  assert.equal(again, state);
});

test("a session refresh does not wipe unsaved edits", () => {
  const edited = reduceProfileForm(initialProfileState(user), {
    type: "edit",
    field: "phone",
    value: "09120000000",
  });
  const refreshed = reduceProfileForm(edited, {
    type: "user",
    user: { ...user, name: "نام سرور" },
  });
  assert.equal(refreshed.draft.phone, "09120000000");
  assert.equal(refreshed.draft.name, "سارا محمدی");
});
