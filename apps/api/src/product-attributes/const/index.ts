/**
 * Mirrors `PRODUCT_ATTRIBUTE_INPUT_TYPES` in `@rad/types` (the API is
 * CommonJS and cannot import that ESM package).
 */
export const PRODUCT_ATTRIBUTE_INPUT_TYPES = [
  "text",
  "number",
  "select",
  "multiselect",
  "boolean",
] as const;

export const MAX_ATTRIBUTE_OPTIONS = 100;
