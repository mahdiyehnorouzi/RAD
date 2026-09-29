/**
 * Mirrors `SHAPE_TRAITS` in `@rad/types` (the API is CommonJS and cannot
 * import that ESM package). Each is a key of an artwork's passport traits.
 */
export const SHAPE_TRAITS = [
  "crooked",
  "quiet",
  "worn",
  "surprise",
  "strange",
] as const;

/** Every quiz question offers exactly this many choices. */
export const SHAPE_CHOICE_COUNT = 2;
