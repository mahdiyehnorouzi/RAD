import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { BadRequestException } from "@nestjs/common";
import {
  coerceAttributeValue,
  formatAttributeDisplayValue,
} from "./product-attributes.mapper";

const colorAttribute = {
  id: "attr_color",
  key: "color",
  label: "رنگ",
  inputType: "select",
  unit: null,
  required: true,
  active: true,
  sortOrder: 0,
  options: [
    { id: "opt_1", attributeId: "attr_color", value: "white", label: "سفید", sortOrder: 0 },
    { id: "opt_2", attributeId: "attr_color", value: "black", label: "مشکی", sortOrder: 1 },
  ],
  categoryLinks: [],
} as const;

const heightAttribute = {
  id: "attr_height",
  key: "height",
  label: "ارتفاع",
  inputType: "number",
  unit: "سانتی‌متر",
  required: false,
  active: true,
  sortOrder: 1,
  options: [],
  categoryLinks: [],
} as const;

const washableAttribute = {
  id: "attr_washable",
  key: "washable",
  label: "قابل شست‌وشو",
  inputType: "boolean",
  unit: null,
  required: false,
  active: true,
  sortOrder: 2,
  options: [],
  categoryLinks: [],
} as const;

const materialsAttribute = {
  id: "attr_materials",
  key: "materials",
  label: "مواد",
  inputType: "multiselect",
  unit: null,
  required: false,
  active: true,
  sortOrder: 3,
  options: [
    { id: "opt_a", attributeId: "attr_materials", value: "clay", label: "سفال", sortOrder: 0 },
    { id: "opt_b", attributeId: "attr_materials", value: "glass", label: "شیشه", sortOrder: 1 },
  ],
  categoryLinks: [],
} as const;

describe("coerceAttributeValue", () => {
  test("accepts a known select option", () => {
    assert.equal(coerceAttributeValue(colorAttribute as never, "white"), "white");
  });

  test("rejects a select value outside the defined options", () => {
    assert.throws(
      () => coerceAttributeValue(colorAttribute as never, "pink"),
      BadRequestException,
    );
  });

  test("coerces a numeric string for a number attribute", () => {
    assert.equal(coerceAttributeValue(heightAttribute as never, "12"), 12);
  });

  test("rejects a non-finite number", () => {
    assert.throws(
      () => coerceAttributeValue(heightAttribute as never, "not-a-number"),
      BadRequestException,
    );
  });

  test("requires a real boolean, not a truthy string", () => {
    assert.throws(
      () => coerceAttributeValue(washableAttribute as never, "true"),
      BadRequestException,
    );
    assert.equal(coerceAttributeValue(washableAttribute as never, false), false);
  });

  test("de-duplicates and validates a multiselect against its options", () => {
    assert.deepEqual(
      coerceAttributeValue(materialsAttribute as never, ["clay", "clay", "glass"]),
      ["clay", "glass"],
    );
    assert.throws(
      () => coerceAttributeValue(materialsAttribute as never, ["clay", "wood"]),
      BadRequestException,
    );
  });
});

describe("formatAttributeDisplayValue", () => {
  test("renders a select value as its option label", () => {
    assert.deepEqual(formatAttributeDisplayValue(colorAttribute as never, "white"), {
      key: "color",
      label: "رنگ",
      value: "سفید",
    });
  });

  test("renders a number with Persian digits and the configured unit", () => {
    assert.deepEqual(formatAttributeDisplayValue(heightAttribute as never, 12), {
      key: "height",
      label: "ارتفاع",
      value: "۱۲ سانتی‌متر",
    });
  });

  test("renders a boolean as بله/خیر", () => {
    assert.deepEqual(formatAttributeDisplayValue(washableAttribute as never, false), {
      key: "washable",
      label: "قابل شست‌وشو",
      value: "خیر",
    });
    assert.deepEqual(formatAttributeDisplayValue(washableAttribute as never, true)?.value, "بله");
  });

  test("hides an attribute with no stored value", () => {
    assert.equal(formatAttributeDisplayValue(heightAttribute as never, undefined), null);
  });

  test("joins a multiselect's option labels", () => {
    assert.deepEqual(
      formatAttributeDisplayValue(materialsAttribute as never, ["clay", "glass"])?.value,
      "سفال، شیشه",
    );
  });
});
