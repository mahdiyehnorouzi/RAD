/**
 * Mirrors `DAMAGE_REPORT_STATUSES`, `DAMAGE_RESOLUTIONS` and
 * `DAMAGE_REPORT_WINDOW_HOURS` in `@rad/types` (the API is CommonJS and
 * cannot import that ESM package). Keep them identical.
 */
export const DAMAGE_REPORT_STATUSES = [
  "submitted",
  "reviewing",
  "approved",
  "declined",
] as const;

export const DAMAGE_RESOLUTIONS = ["repair", "refund"] as const;

export const DAMAGE_REPORT_WINDOW_HOURS = 24;

/** Orders a customer can report damage on: the work has left the studio. */
export const DAMAGE_REPORTABLE_ORDER_STATUSES = ["shipped", "delivered"] as const;

export const DAMAGE_OPEN_STATUSES = ["submitted", "reviewing"] as const;

export const DAMAGE_BODY_MAX = 2000;
export const DAMAGE_NOTE_MAX = 1000;
export const DAMAGE_PHOTO_LIMIT = 2 * 1024 * 1024;
export const DAMAGE_PHOTO_ERROR =
  "فقط عکس JPEG، PNG یا WebP تا ۲ مگابایت قابل ارسال است.";
