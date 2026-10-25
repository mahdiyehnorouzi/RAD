/**
 * Dynamic product attributes ("ویژگی‌های محصول"): admin-defined specs
 * (رنگ، جنس، ارتفاع، …) assigned to one or more product categories and
 * filled in per product. Mirrored by `PRODUCT_ATTRIBUTE_INPUT_TYPES` in the
 * API (CommonJS cannot import this package).
 */
export const PRODUCT_ATTRIBUTE_INPUT_TYPES = [
  "text",
  "number",
  "select",
  "multiselect",
  "boolean",
] as const;
export type ProductAttributeInputType =
  (typeof PRODUCT_ATTRIBUTE_INPUT_TYPES)[number];

/** A selectable option of a `select`/`multiselect` attribute. */
export interface ProductAttributeOption {
  id: string;
  /** Stable internal key (e.g. `white`); never renamed once referenced by a product. */
  value: string;
  /** Persian display label (e.g. `سفید`). */
  label: string;
  sortOrder: number;
}

/** An attribute definition, managed by admins without touching code. */
export interface ProductAttribute {
  id: string;
  /** Stable internal key (e.g. `color`); never renamed once referenced by a product. */
  key: string;
  /** Persian display name (e.g. `رنگ`). */
  label: string;
  inputType: ProductAttributeInputType;
  /** Unit shown next to a `number` value (e.g. `سانتی‌متر`). */
  unit?: string | null;
  required: boolean;
  active: boolean;
  sortOrder: number;
  /** Store category values (`ProductCategory`) this attribute applies to. */
  categories: string[];
  /** Only meaningful for `select`/`multiselect`. */
  options: ProductAttributeOption[];
}

export type ProductAttributeOptionInput = Omit<ProductAttributeOption, "id">;

export type ProductAttributeInput = Omit<ProductAttribute, "id" | "options"> & {
  options: ProductAttributeOptionInput[];
};

/** A product's stored value for one attribute; shape depends on `inputType`. */
export type ProductAttributeValue = string | number | boolean | string[];

/** One attribute, already resolved and formatted for display on a product. */
export interface ProductSpecAttribute {
  key: string;
  label: string;
  /** Already formatted for display (Persian digits, بله/خیر, unit, …). */
  value: string;
}
