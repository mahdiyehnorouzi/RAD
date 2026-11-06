import "./test-dom";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { HelpQuestion, HelpQuestionInput } from "./admin-data";
import { AdminHelpQuestions } from "../features/help/admin-help-questions";
import {
  click,
  domDocument,
  elements,
  setControlValue,
  textOf,
  type DomNode,
} from "./test-dom";

const question = (id: string, fa: string, en: string): HelpQuestion => ({
  id,
  question: { fa, en },
  answer: { fa: `جواب ${fa}`, en: `Answer ${en}` },
});

const shipping: HelpQuestion = {
  id: "h-ship",
  question: { fa: "ارسال چقدر طول می‌کشد؟", en: "How long is shipping?" },
  answer: { fa: "چند روز", en: "A few days" },
  more: { slug: "shipping", section: "window" },
};

const retry = () => {};
const save = async () => true;
const noop = async () => {};

function buttons(root: DomNode, label: string) {
  return elements(root, "button").filter(
    (node) => textOf(node).trim() === label,
  );
}

async function press(node: DomNode | undefined) {
  assert.ok(node);
  await act(async () => {
    click(node);
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function type(node: DomNode, value: string) {
  await act(async () => {
    setControlValue(node, value);
    await Promise.resolve();
  });
}

function labeled(root: DomNode, label: string) {
  return elements(root, "button").filter(
    (node) => node.getAttribute("aria-label") === label,
  );
}

function controlByLabel(root: DomNode, label: string) {
  const match = elements(root, "label").find((node) => {
    const span = elements(node, "span")[0];
    return span != null && textOf(span).trim() === label;
  });
  assert.ok(match, label);
  const control = ["input", "textarea", "select"]
    .flatMap((tag) => elements(match, tag))
    .at(0);
  assert.ok(control, label);
  return control;
}

async function mount(
  props: Partial<Parameters<typeof AdminHelpQuestions>[0]> & {
    questions?: HelpQuestion[];
  } = {},
) {
  const doc = domDocument();
  const container = doc.createElement("div");
  doc.body.appendChild(container);
  const root: Root = createRoot(container as unknown as Element);
  const propsRef = {
    questions: props.questions ?? [],
    loading: props.loading ?? false,
    loadError: props.loadError ?? false,
    refreshing: props.refreshing ?? false,
    refreshError: props.refreshError ?? false,
    onRetry: props.onRetry ?? retry,
    canWrite: props.canWrite ?? true,
    onSave: props.onSave ?? save,
    onDelete: props.onDelete ?? noop,
    onReorder: props.onReorder ?? noop,
  };
  const render = async () => {
    await act(async () => {
      root.render(
        createElement(AdminHelpQuestions, {
          ...propsRef,
        }),
      );
    });
  };
  await render();
  return {
    container,
    propsRef,
    render,
    async unmount() {
      await act(async () => {
        root.unmount();
      });
      container.parentNode?.removeChild(container);
    },
  };
}

test("help questions show a skeleton while loading and the empty copy only after a successful empty load", async () => {
  const loading = await mount({ loading: true, questions: [] });
  assert.match(textOf(loading.container), /در حال بارگذاری پرسش‌های راهنما/);
  assert.doesNotMatch(textOf(loading.container), /هنوز سؤالی نیست/);
  assert.equal(buttons(loading.container, "سؤال تازه")[0]?.disabled, true);
  await loading.unmount();

  const empty = await mount({ questions: [] });
  assert.match(textOf(empty.container), /هنوز سؤالی نیست/);
  assert.equal(buttons(empty.container, "سؤال تازه")[0]?.disabled, false);
  await empty.unmount();
});

test("a failed help load offers retry and does not look empty", async () => {
  let retries = 0;
  const view = await mount({
    loadError: true,
    questions: [],
    onRetry: () => {
      retries += 1;
    },
  });
  assert.match(textOf(view.container), /دریافت پرسش‌های راهنما ناموفق بود/);
  assert.doesNotMatch(textOf(view.container), /هنوز سؤالی نیست/);
  await press(buttons(view.container, "تلاش دوباره")[0]);
  assert.equal(retries, 1);
  await view.unmount();
});

test("a failed refresh keeps the Persian and English question and the storefront help link", async () => {
  const view = await mount({
    questions: [shipping],
    refreshError: true,
    refreshing: true,
  });
  const text = textOf(view.container);
  assert.match(text, /ارسال چقدر طول می‌کشد؟/);
  assert.match(text, /How long is shipping\?/);
  assert.match(text, /اطلاعات قبلی هنوز نمایش داده می‌شود/);
  assert.doesNotMatch(text, /هنوز سؤالی نیست/);
  const link = elements(view.container, "a")[0];
  assert.ok(link);
  assert.match(link.getAttribute("href") ?? "", /\/help$/);
  assert.equal(link.getAttribute("target"), "_blank");
  assert.match(text, /ارسال و تحویل/);
  assert.match(text, /#window/);
  await view.unmount();
});

test("a reader sees questions and cannot open create, edit, delete, or reorder", async () => {
  const view = await mount({
    questions: [question("h1", "چطور سفارش بدهم؟", "How do I order?")],
    canWrite: false,
  });
  assert.match(textOf(view.container), /چطور سفارش بدهم؟/);
  assert.match(textOf(view.container), /How do I order\?/);
  const create = buttons(view.container, "سؤال تازه")[0];
  assert.equal(create?.disabled, true);
  await press(create);
  assert.equal(elements(view.container, "form").length, 0);
  assert.equal(buttons(view.container, "ویرایش").length, 0);
  assert.equal(buttons(view.container, "حذف").length, 0);
  assert.equal(labeled(view.container, "بالا بردن سؤال ۱").length, 0);
  await view.unmount();
});

test("create validates Persian and English fields, then saves and closes", async () => {
  const saved: HelpQuestionInput[] = [];
  const view = await mount({
    questions: [],
    onSave: async (input) => {
      saved.push(input);
      return true;
    },
  });
  await press(buttons(view.container, "سؤال تازه")[0]);
  assert.match(textOf(view.container), /سؤال تازه/);
  await press(buttons(view.container, "ذخیره")[0]);
  assert.equal(saved.length, 0);
  assert.match(textOf(view.container), /متن فارسی سؤال را بنویسید/);
  assert.match(textOf(view.container), /متن انگلیسی سؤال را بنویسید/);
  assert.match(textOf(view.container), /جواب فارسی را بنویسید/);
  assert.match(textOf(view.container), /جواب انگلیسی را بنویسید/);

  await type(controlByLabel(view.container, "سؤال (فارسی)"), "سؤال نو");
  await type(controlByLabel(view.container, "سؤال (انگلیسی)"), "New question");
  await type(controlByLabel(view.container, "جواب (فارسی)"), "جواب نو");
  await type(controlByLabel(view.container, "جواب (انگلیسی)"), "New answer");
  await type(
    controlByLabel(view.container, "پیوند «بیشتر بخوانید»"),
    "shipping",
  );
  await type(
    controlByLabel(view.container, "بخش (اختیاری، مثل window)"),
    "Not A Slug",
  );
  await press(buttons(view.container, "ذخیره")[0]);
  assert.match(textOf(view.container), /فقط حروف انگلیسی کوچک، عدد و خط تیره/);
  assert.equal(saved.length, 0);

  await type(
    controlByLabel(view.container, "بخش (اختیاری، مثل window)"),
    "window",
  );
  await press(buttons(view.container, "ذخیره")[0]);
  assert.equal(saved.length, 1);
  assert.deepEqual(saved[0], {
    question: { fa: "سؤال نو", en: "New question" },
    answer: { fa: "جواب نو", en: "New answer" },
    more: { slug: "shipping", section: "window" },
  });
  assert.equal(elements(view.container, "form").length, 0);
  await view.unmount();
});

test("a failed save keeps the dialog and the typed text", async () => {
  const view = await mount({
    questions: [],
    onSave: async () => {
      throw new Error("ذخیره نشد. متن‌ها سر جایشان است. دوباره تلاش کنید.");
    },
  });
  await press(buttons(view.container, "سؤال تازه")[0]);
  await type(controlByLabel(view.container, "سؤال (فارسی)"), "سؤال نو");
  await type(controlByLabel(view.container, "سؤال (انگلیسی)"), "New question");
  await type(controlByLabel(view.container, "جواب (فارسی)"), "جواب نو");
  await type(controlByLabel(view.container, "جواب (انگلیسی)"), "New answer");
  await press(buttons(view.container, "ذخیره")[0]);
  assert.match(
    textOf(view.container),
    /ذخیره نشد\. متن‌ها سر جایشان است\. دوباره تلاش کنید\./,
  );
  assert.equal(controlByLabel(view.container, "سؤال (فارسی)").value, "سؤال نو");
  assert.equal(elements(view.container, "form").length, 1);
  await press(buttons(view.container, "انصراف")[0]);
  assert.equal(elements(view.container, "form").length, 0);
  await view.unmount();
});

test("edit opens the existing Persian and English text and can be cancelled", async () => {
  let calls = 0;
  const view = await mount({
    questions: [question("h1", "چطور سفارش بدهم؟", "How do I order?")],
    onSave: async () => {
      calls += 1;
      return true;
    },
  });
  await press(buttons(view.container, "ویرایش")[0]);
  assert.match(textOf(view.container), /ویرایش سؤال/);
  assert.equal(
    controlByLabel(view.container, "سؤال (فارسی)").value,
    "چطور سفارش بدهم؟",
  );
  assert.equal(
    controlByLabel(view.container, "سؤال (انگلیسی)").value,
    "How do I order?",
  );
  assert.equal(
    controlByLabel(view.container, "جواب (فارسی)").value,
    "جواب چطور سفارش بدهم؟",
  );
  assert.equal(
    controlByLabel(view.container, "جواب (انگلیسی)").value,
    "Answer How do I order?",
  );
  await press(buttons(view.container, "انصراف")[0]);
  assert.equal(calls, 0);
  assert.equal(elements(view.container, "form").length, 0);
  await view.unmount();
});

test("delete asks for confirmation, cancel leaves the question, and confirm deletes it", async () => {
  const deleted: string[] = [];
  const view = await mount({
    questions: [question("h1", "چطور سفارش بدهم؟", "How do I order?")],
    onDelete: async (id) => {
      deleted.push(id);
    },
  });
  await press(buttons(view.container, "حذف")[0]);
  assert.match(textOf(view.container), /حذف این سؤال؟/);
  assert.match(textOf(view.container), /چطور سفارش بدهم؟/);
  await press(buttons(view.container, "انصراف")[0]);
  assert.equal(deleted.length, 0);
  assert.doesNotMatch(textOf(view.container), /حذف این سؤال؟/);

  await press(buttons(view.container, "حذف")[0]);
  await press(buttons(view.container, "حذف سؤال")[0]);
  assert.deepEqual(deleted, ["h1"]);
  assert.doesNotMatch(textOf(view.container), /حذف این سؤال؟/);
  await view.unmount();
});

test("a failed delete stays on the confirmation and does not remove the question", async () => {
  const view = await mount({
    questions: [question("h1", "چطور سفارش بدهم؟", "How do I order?")],
    onDelete: async () => {
      throw new Error("حذف ناموفق بود");
    },
  });
  await press(buttons(view.container, "حذف")[0]);
  await press(buttons(view.container, "حذف سؤال")[0]);
  assert.match(textOf(view.container), /حذف ناموفق بود/);
  assert.match(textOf(view.container), /حذف این سؤال؟/);
  assert.match(textOf(view.container), /چطور سفارش بدهم؟/);
  await view.unmount();
});

test("reorder sends the new id order, a failure keeps the previous order, and a second move is ignored while the first is in flight", async () => {
  const orders: string[][] = [];
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const view = await mount({
    questions: [
      question("h1", "اول", "First"),
      question("h2", "دوم", "Second"),
    ],
    onReorder: async (ids) => {
      orders.push(ids);
      await gate;
    },
  });
  const down = labeled(view.container, "پایین بردن سؤال ۱")[0];
  assert.ok(down);
  await act(async () => {
    click(down);
    click(down);
  });
  assert.deepEqual(orders, [["h2", "h1"]]);
  assert.match(textOf(view.container), /اول/);
  release();
  await act(async () => {
    await gate;
  });
  assert.doesNotMatch(textOf(view.container), /جابه‌جایی سؤال ناموفق بود/);

  view.propsRef.onReorder = async () => {
    throw new Error("ارتباط قطع شد");
  };
  await view.render();
  await press(labeled(view.container, "پایین بردن سؤال ۱")[0]);
  assert.match(textOf(view.container), /ارتباط قطع شد/);
  assert.match(textOf(view.container), /اول/);
  assert.match(textOf(view.container), /دوم/);
  await view.unmount();
});
