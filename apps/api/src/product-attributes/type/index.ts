import type { PRODUCT_ATTRIBUTE_INPUT_TYPES } from "../const";

export type ProductAttributeInputType =
  (typeof PRODUCT_ATTRIBUTE_INPUT_TYPES)[number];

/** Mirrors `ProductAttribute` in `@rad/types`. */
export type ProductAttributeView = {
  id: string;
  key: string;
  label: string;
  inputType: ProductAttributeInputType;
  unit: string | null;
  required: boolean;
  active: boolean;
  sortOrder: number;
  categories: string[];
  options: { id: string; value: string; label: string; sortOrder: number }[];
};

/** A product's value for one attribute, resolved for display. */
export type ProductAttributeDisplayValue = {
  key: string;
  label: string;
  value: string;
};
