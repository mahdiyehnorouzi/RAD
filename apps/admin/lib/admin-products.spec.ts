import "./test-dom";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { AdminProduct, ProductAttribute } from "./admin-data";
import { Products } from "../features/products/admin-products";
import { ProductDialog } from "../features/products/admin-product-dialog";
import {
  click,
  domDocument,
  elements,
  setControlValue,
  textOf,
  type DomNode,
} from "./test-dom";

function buttons(root: DomNode, label: string) {
  return elements(root, "button").filter((node) =>
    textOf(node).includes(label),
  );
}

/** Finds a `Field`'s `<label>` wrapper by its visible label text, scoped to `root`. */
function fieldLabels(root: DomNode, label: string) {
  return elements(root, "label").filter((node) => {
    const span = elements(node, "span")[0];
    return span ? textOf(span) === label : false;
  });
}

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

function makeProduct(overrides: Partial<AdminProduct> = {}): AdminProduct {
  return {
    id: "p1",
    slug: "vase-one",
    name: "گلدان یک",
    description: "توضیحات گلدان یک",
    category: "گلدان",
    price: 500000,
    status: "available",
    artist: "استودیو رَد",
    images: [{ storage: "external", src: "/vase-one.jpg" }],
    updatedAt: Date.now(),
    attributeValues: {},
    ...overrides,
  };
}

const p1 = makeProduct();
const p2 = makeProduct({
  id: "p2",
  slug: "cup-two",
  name: "فنجان دو",
  description: "توضیحات فنجان دو",
  category: "فنجان",
  price: 200000,
  artist: "هنرمند دیگر",
  status: "sold",
  updatedAt: Date.now() - 1000,
  images: [],
});

type ProductsProps = Parameters<typeof Products>[0];

async function mountProducts(overrides: Partial<ProductsProps> = {}) {
  const doc = domDocument();
  const host = doc.createElement("div");
  doc.body.appendChild(host);
  const root: Root = createRoot(host as unknown as Element);
  const base: ProductsProps = {
    products: [p1, p2],
    canWrite: true,
    onCreate: () => {},
    onEdit: () => {},
    onDelete: () => {},
    ...overrides,
  };
  await act(async () => {
    root.render(createElement(Products, base));
  });
  return { host, root };
}

test("renders every product's name, slug, and category", async () => {
  const { host } = await mountProducts();
  const text = textOf(host);
  assert.match(text, /گلدان یک/);
  assert.match(text, /فنجان دو/);
  assert.match(text, /vase-one/);
  assert.match(text, /cup-two/);
});

test("search filters the list by name, artist, or slug", async () => {
  const { host } = await mountProducts();
  await fill(elements(host, "input")[0], "فنجان");
  assert.match(textOf(host), /فنجان دو/);
  assert.doesNotMatch(textOf(host), /گلدان یک/);
});

test("status filter narrows the list to the chosen status", async () => {
  const { host } = await mountProducts();
  const statusSelect = elements(host, "select").find(
    (node) => node.getAttribute("aria-label") === "وضعیت",
  );
  assert.ok(statusSelect);
  await fill(statusSelect!, "sold");
  assert.match(textOf(host), /فنجان دو/);
  assert.doesNotMatch(textOf(host), /گلدان یک/);
});

test("category filter narrows the list to the chosen category", async () => {
  const { host } = await mountProducts();
  const categorySelect = elements(host, "select").find(
    (node) => node.getAttribute("aria-label") === "دسته‌بندی",
  );
  assert.ok(categorySelect);
  await fill(categorySelect!, "فنجان");
  assert.match(textOf(host), /فنجان دو/);
  assert.doesNotMatch(textOf(host), /گلدان یک/);
});

test("sorting by cheapest orders the cheaper product first", async () => {
  const { host } = await mountProducts();
  const sortSelect = elements(host, "select").find(
    (node) => node.getAttribute("aria-label") === "مرتب‌سازی",
  );
  assert.ok(sortSelect);
  await fill(sortSelect!, "price_asc");
  const text = textOf(host);
  assert.ok(text.indexOf("فنجان دو") < text.indexOf("گلدان یک"));
});

test("a search with no matches shows the empty state", async () => {
  const { host } = await mountProducts();
  await fill(elements(host, "input")[0], "چیزی که نیست");
  assert.match(textOf(host), /محصولی پیدا نشد/);
});

test("the add button is disabled for a read-only admin and does not call onCreate", async () => {
  let created = false;
  const { host } = await mountProducts({
    canWrite: false,
    onCreate: () => {
      created = true;
    },
  });
  const add = buttons(host, "افزودن اثر")[0];
  assert.ok(add);
  assert.ok(add.disabled);
  await press(add);
  assert.equal(created, false);
});

test("a writer can click add to open the creator", async () => {
  let created = false;
  const { host } = await mountProducts({
    onCreate: () => {
      created = true;
    },
  });
  await press(buttons(host, "افزودن اثر")[0]);
  assert.equal(created, true);
});

type DialogProps = Parameters<typeof ProductDialog>[0];

const attributes: ProductAttribute[] = [];

async function mountDialog(overrides: Partial<DialogProps> = {}) {
  const originalFetch = globalThis.fetch;
  (globalThis as unknown as { fetch: typeof fetch }).fetch = (async () =>
    ({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ image: 10 * 1024 * 1024, video: 50 * 1024 * 1024 }),
    }) as unknown as Response) as typeof fetch;
  const doc = domDocument();
  const host = doc.createElement("div");
  doc.body.appendChild(host);
  const root: Root = createRoot(host as unknown as Element);
  const base: DialogProps = {
    product: null,
    onClose: () => {},
    onSave: async () => {},
    onUploadImage: async () => ({
      storage: "cloudinary",
      objectKey: "obj-1",
    }),
    onFetchAttributes: async () => attributes,
    ...overrides,
  };
  await act(async () => {
    root.render(createElement(ProductDialog, base));
  });
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  return {
    host,
    root,
    restoreFetch: () => {
      (globalThis as unknown as { fetch: typeof fetch }).fetch = originalFetch;
    },
  };
}

test("a new product starts with empty defaults and no delete button", async () => {
  const { host, restoreFetch } = await mountDialog();
  assert.match(textOf(host), /اثر تازه/);
  assert.equal((field(host, "نام اثر") as DomNode).value, "");
  assert.equal(buttons(host, "حذف محصول").length, 0);
  restoreFetch();
});

test("editing an existing product pre-fills its fields and shows delete only when onDelete is provided", async () => {
  const { host, restoreFetch } = await mountDialog({
    product: p1,
    onDelete: () => {},
  });
  assert.match(textOf(host), /ویرایش اثر/);
  assert.equal((field(host, "نام اثر") as DomNode).value, p1.name);
  assert.equal(buttons(host, "حذف محصول").length, 1);
  restoreFetch();
});

test("the price field parses Persian digits into a number", async () => {
  const { host, restoreFetch } = await mountDialog();
  const priceField = field(host, "قیمت اثر (تومان)");
  await fill(priceField, "۱۲۳۴۵۶");
  assert.equal(priceField.value, new Intl.NumberFormat("fa-IR").format(123456));
  restoreFetch();
});

test("submitting without a name, description, or image shows validation errors and does not save", async () => {
  let saved = false;
  const { host, restoreFetch } = await mountDialog({
    onSave: async () => {
      saved = true;
    },
  });
  await press(buttons(host, "ذخیره تغییرات")[0]);
  assert.match(textOf(host), /حداقل یک تصویر برای اثر لازم است/);
  assert.equal(saved, false);
  restoreFetch();
});

test("a valid edit submits and calls onSave with the product", async () => {
  const captured: AdminProduct[] = [];
  const { host, restoreFetch } = await mountDialog({
    product: p1,
    onSave: async (product) => {
      captured.push(product);
    },
  });
  await press(buttons(host, "ذخیره تغییرات")[0]);
  assert.equal(captured.length, 1);
  assert.equal(captured[0].id, p1.id);
  assert.equal(captured[0].name, p1.name);
  restoreFetch();
});

test("clicking delete calls onDelete", async () => {
  let deleted = false;
  const { host, restoreFetch } = await mountDialog({
    product: p1,
    onDelete: () => {
      deleted = true;
    },
  });
  await press(buttons(host, "حذف محصول")[0]);
  assert.equal(deleted, true);
  restoreFetch();
});
