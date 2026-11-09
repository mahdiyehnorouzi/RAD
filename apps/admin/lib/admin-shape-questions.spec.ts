import "./test-dom";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ShapeQuestion, ShapeQuestionInput } from "./admin-data";
import { AdminShapeQuestions } from "../features/shape/admin-shape-questions";
import {
  click,
  domDocument,
  elements,
  setControlValue,
  textOf,
  type DomNode,
} from "./test-dom";

const choice = (value: number, fa: string, en: string) => ({
  label: { fa, en },
  note: { fa: `${fa} توضیح`, en: `${en} note` },
  photo: { src: `/${en}.jpg`, alt: { fa, en } },
  value,
});

const q1: ShapeQuestion = {
  id: "s1",
  trait: "crooked",
  prompt: { fa: "کج ایستاده؟", en: "crooked?" },
  hint: { fa: "به لبه نگاه کن", en: "look at the rim" },
  choices: [choice(0.2, "آرام", "calm"), choice(0.9, "کج", "crooked")],
};

const q2: ShapeQuestion = {
  id: "s2",
  trait: "quiet",
  prompt: { fa: "لعاب روشنه؟", en: "bright glaze?" },
  hint: { fa: "به سطح نگاه کن", en: "look at the surface" },
  choices: [choice(0.1, "تیره", "dark"), choice(0.8, "روشن", "bright")],
};

function buttons(root: DomNode, label: string) {
  return elements(root, "button").filter((node) =>
    textOf(node).includes(label),
  );
}

function buttonsByAriaLabel(root: DomNode, label: string) {
  return elements(root, "button").filter((node) =>
    (node.getAttribute("aria-label") ?? "").includes(label),
  );
}

/** Finds a `Field`'s `<label>` wrapper by its visible label text, scoped to `root`. */
function fieldLabels(root: DomNode, label: string) {
  return elements(root, "label").filter((node) => {
    const span = elements(node, "span")[0];
    return span ? textOf(span) === label : false;
  });
}

/** The input/select control inside the first `Field` matching `label`, within `root`. */
function field(root: DomNode, label: string) {
  const wrapper = fieldLabels(root, label)[0];
  assert.ok(wrapper, `expected a field labeled "${label}"`);
  const control =
    elements(wrapper, "input")[0] ?? elements(wrapper, "select")[0];
  assert.ok(control, `expected a control inside the "${label}" field`);
  return control;
}

async function fill(node: DomNode, value: string) {
  await act(async () => {
    setControlValue(node, value);
    await Promise.resolve();
  });
}

async function press(node: DomNode | undefined) {
  assert.ok(node);
  await act(async () => {
    click(node);
    await Promise.resolve();
    await Promise.resolve();
  });
}

type Props = Parameters<typeof AdminShapeQuestions>[0];

async function mount(props: Partial<Props> = {}) {
  const doc = domDocument();
  const host = doc.createElement("div");
  doc.body.appendChild(host);
  const root: Root = createRoot(host as unknown as Element);
  const base: Props = {
    questions: [q1, q2],
    loading: false,
    loadError: false,
    onRetry: () => {},
    canWrite: true,
    onSave: async () => true,
    onDelete: async () => {},
    onReorder: async () => {},
    ...props,
  };
  await act(async () => {
    root.render(createElement(AdminShapeQuestions, base));
  });
  return { host, root };
}

test("read-only admins see questions but no row actions and a disabled add button", async () => {
  const { host } = await mount({ canWrite: false });
  assert.match(textOf(host), /کج ایستاده؟/);
  assert.equal(buttons(host, "ویرایش").length, 0);
  assert.equal(buttons(host, "حذف").length, 0);
  const add = buttons(host, "سؤال تازه")[0];
  assert.ok(add);
  assert.ok(add.disabled);
});

test("writers can see row actions for every question", async () => {
  const { host } = await mount();
  assert.equal(buttons(host, "ویرایش").length, 2);
  assert.equal(buttons(host, "حذف").length, 2);
});

test("moving a question down calls onReorder with the new id order", async () => {
  let saved: string[] | null = null;
  const { host } = await mount({
    onReorder: async (ids) => {
      saved = ids;
    },
  });
  const down = buttonsByAriaLabel(host, "پایین بردن")[0];
  await press(down);
  assert.deepEqual(saved, ["s2", "s1"]);
});

test("a failed reorder shows an inline error and does not throw", async () => {
  const { host } = await mount({
    onReorder: async () => {
      throw new Error("جابه‌جایی سؤال ناموفق بود. ترتیب قبلی سر جایش است.");
    },
  });
  const down = buttonsByAriaLabel(host, "پایین بردن")[0];
  await press(down);
  assert.match(textOf(host), /ترتیب قبلی سر جایش است/);
});

test("deleting a question opens a confirmation and only calls onDelete after confirming", async () => {
  let deletedId: string | null = null;
  const { host } = await mount({
    onDelete: async (id) => {
      deletedId = id;
    },
  });
  await press(buttons(host, "حذف")[0]);
  assert.match(textOf(host), /حذف این سؤال؟/);
  assert.equal(deletedId, null);
  await press(buttons(host, "حذف سؤال")[0]);
  assert.equal(deletedId, "s1");
});

test("editing an existing question opens the dialog pre-filled and submitting unchanged saves it", async () => {
  let savedInput: ShapeQuestionInput | null = null;
  let savedId: string | undefined;
  const { host } = await mount({
    onSave: async (input, id) => {
      savedInput = input;
      savedId = id;
      return true;
    },
  });
  await press(buttons(host, "ویرایش")[0]);
  assert.match(textOf(host), /کج ایستاده؟/);
  const submit = buttons(host, "ذخیره")[0];
  await press(submit);
  assert.equal(savedId, "s1");
  assert.ok(savedInput);
  assert.equal(
    (savedInput as unknown as ShapeQuestionInput).prompt.fa,
    "کج ایستاده؟",
  );
  // Dialog closes after a successful save.
  assert.doesNotMatch(textOf(host), /کج ایستاده؟[\s\S]*کج ایستاده؟/);
});

async function fillNewQuestionForm(host: DomNode) {
  await fill(field(host, "سؤال (فارسی)"), "آیا لبه صاف است؟");
  await fill(field(host, "سؤال (انگلیسی)"), "is the rim straight?");
  await fill(field(host, "راهنما (فارسی)"), "به لبه ظرف نگاه کن");
  await fill(field(host, "راهنما (انگلیسی)"), "look at the rim of the piece");

  const fieldsets = elements(host, "fieldset");
  assert.equal(fieldsets.length, 2);
  const [first, second] = fieldsets;

  await fill(field(first, "عنوان (فارسی)"), "صاف");
  await fill(field(first, "عنوان (انگلیسی)"), "straight");
  await fill(field(first, "توضیح (فارسی)"), "صاف توضیح");
  await fill(field(first, "توضیح (انگلیسی)"), "straight note");
  await fill(
    field(first, "آدرس عکس (مثل /shape/q1-straight.webp)"),
    "/straight.jpg",
  );
  await fill(field(first, "توضیح عکس (فارسی)"), "صاف");
  await fill(field(first, "توضیح عکس (انگلیسی)"), "straight");

  await fill(field(second, "عنوان (فارسی)"), "کج");
  await fill(field(second, "عنوان (انگلیسی)"), "crooked");
  await fill(field(second, "توضیح (فارسی)"), "کج توضیح");
  await fill(field(second, "توضیح (انگلیسی)"), "crooked note");
  await fill(
    field(second, "آدرس عکس (مثل /shape/q1-straight.webp)"),
    "/crooked.jpg",
  );
  await fill(field(second, "توضیح عکس (فارسی)"), "کج");
  await fill(field(second, "توضیح عکس (انگلیسی)"), "crooked");
}

test("creating a question fills bilingual fields and both choices, then saves with no id", async () => {
  let savedInput: ShapeQuestionInput | null = null;
  let savedId: string | undefined = "not-called";
  let calls = 0;
  const { host } = await mount({
    onSave: async (input, id) => {
      calls += 1;
      savedInput = input;
      savedId = id;
      return true;
    },
  });

  await press(buttons(host, "سؤال تازه")[0]);
  // The dialog opened: its fieldsets for the two choices are now present.
  assert.equal(elements(host, "fieldset").length, 2);
  await fillNewQuestionForm(host);

  const submit = buttons(host, "ذخیره")[0];
  await press(submit);

  assert.equal(calls, 1);
  // A new question is saved with no id argument at all.
  assert.equal(savedId, undefined);
  assert.ok(savedInput);
  const input = savedInput as unknown as ShapeQuestionInput;
  assert.equal(input.trait, "crooked");
  assert.deepEqual(input.prompt, {
    fa: "آیا لبه صاف است؟",
    en: "is the rim straight?",
  });
  assert.deepEqual(input.hint, {
    fa: "به لبه ظرف نگاه کن",
    en: "look at the rim of the piece",
  });
  assert.equal(input.choices.length, 2);
  assert.deepEqual(input.choices[0].label, { fa: "صاف", en: "straight" });
  assert.equal(input.choices[0].photo.src, "/straight.jpg");
  assert.deepEqual(input.choices[1].label, { fa: "کج", en: "crooked" });
  assert.equal(input.choices[1].photo.src, "/crooked.jpg");

  // The dialog closes after a successful save: its form fields are gone,
  // only the list (still showing the pre-existing questions) remains.
  assert.equal(elements(host, "fieldset").length, 0);
});

test("a rejected save keeps the dialog open, shows the real error, keeps the entered values, and can be retried", async () => {
  let calls = 0;
  let succeedNext = false;
  const { host } = await mount({
    onSave: async () => {
      calls += 1;
      if (!succeedNext) {
        throw new Error("ذخیره سؤال ناموفق بود. دوباره تلاش کنید.");
      }
      return true;
    },
  });
  await press(buttons(host, "ویرایش")[0]);
  await fill(field(host, "سؤال (فارسی)"), "متن ویرایش‌شده");

  const submit = buttons(host, "ذخیره")[0];
  await press(submit);

  // onSave was actually called.
  assert.equal(calls, 1);
  // The dialog is still open (its form is still rendered).
  assert.equal(elements(host, "fieldset").length, 2);
  // The real, specific error message reaches the user, not a generic one.
  assert.match(textOf(host), /ذخیره سؤال ناموفق بود\. دوباره تلاش کنید\./);
  // The value the admin typed is not cleared by the failed save.
  assert.equal(
    (field(host, "سؤال (فارسی)") as DomNode).value,
    "متن ویرایش‌شده",
  );

  // Retrying (same form, now configured to succeed) saves successfully.
  succeedNext = true;
  await press(buttons(host, "ذخیره")[0]);
  assert.equal(calls, 2);
  assert.doesNotMatch(textOf(host), /ذخیره سؤال ناموفق بود/);
  assert.equal(elements(host, "fieldset").length, 0);
});
