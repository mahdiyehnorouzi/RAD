import assert from "node:assert/strict";
import { test } from "node:test";
import { ForbiddenException } from "@nestjs/common";
import { STORE_CATEGORIES } from "../catalog/category";
import { assertCategoryWrite } from "./admin-categories.controller";
import { KNOWN_CATEGORY_SEEDS } from "./const/category-seeds";

test("parent seeds cover every existing store slug and no children", () => {
  assert.deepEqual(
    KNOWN_CATEGORY_SEEDS.map((seed) => seed.slug),
    [...STORE_CATEGORIES],
  );
  for (const seed of KNOWN_CATEGORY_SEEDS) {
    assert.equal(typeof seed.name.fa, "string");
    assert.equal(typeof seed.name.en, "string");
    assert.ok(seed.name.fa.length > 0);
    assert.ok(seed.name.en.length > 0);
  }
});

test("category writes use the product.write permission", () => {
  assert.throws(() => assertCategoryWrite("viewer"), ForbiddenException);
  assert.throws(() => assertCategoryWrite(undefined), ForbiddenException);
  assert.doesNotThrow(() => assertCategoryWrite("editor"));
  assert.doesNotThrow(() => assertCategoryWrite("manager"));
  assert.doesNotThrow(() => assertCategoryWrite("owner"));
});
