import assert from "node:assert/strict";
import { test } from "node:test";
import type { AdminProduct } from "./admin-data";
import {
  NEW_PRODUCT_EDIT,
  productEditHref,
  productListHref,
  productSnapshot,
  readProductEdit,
  resolveEditedProduct,
} from "../features/products/product-workspace";

function product(id: string): AdminProduct {
  return {
    id,
    slug: id,
    name: id,
    description: "توضیح",
    category: "گلدان",
    price: 10,
    status: "draft",
    artist: "استودیو رَد",
    images: [],
    updatedAt: 1,
  };
}

test("product edit links round-trip the selected id and leave other params", () => {
  assert.equal(readProductEdit(""), null);
  assert.equal(readProductEdit("?edit=abc"), "abc");
  assert.equal(productListHref("?edit=abc&page=2"), "/products?page=2");
  assert.equal(productListHref("?edit=abc"), "/products");
  assert.equal(productEditHref("?page=2", "abc"), "/products?page=2&edit=abc");
  assert.equal(productEditHref("", NEW_PRODUCT_EDIT), "/products?edit=new");
});

test("resolveEditedProduct distinguishes list, create, edit, and a missing id", () => {
  const products = [product("p1")];
  assert.equal(resolveEditedProduct(products, null).kind, "list");
  assert.equal(resolveEditedProduct(products, "new").kind, "new");
  const found = resolveEditedProduct(products, "p1");
  assert.equal(found.kind, "edit");
  assert.equal(resolveEditedProduct(products, "gone").kind, "missing");
});

test("productSnapshot changes when an editable field changes and ignores identity", () => {
  const base = product("p1");
  const copy: AdminProduct = { ...base, id: "other" };
  assert.equal(productSnapshot(base), productSnapshot(copy));
  assert.notEqual(
    productSnapshot(base),
    productSnapshot({ ...base, name: "نام دیگر" }),
  );
  assert.notEqual(
    productSnapshot(base),
    productSnapshot({
      ...base,
      images: [{ storage: "external", src: "/a.jpg" }],
    }),
  );
});
