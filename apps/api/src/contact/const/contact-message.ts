/**
 * Mirrors `CONTACT_TOPICS`, `CONTACT_SOURCES` and `CONTACT_MESSAGE_STATUSES`
 * in `@rad/types` (the API is CommonJS and cannot import that ESM package).
 * Keep the lists identical.
 */
export const CONTACT_TOPICS = [
  "custom",
  "order",
  "payment",
  "collaboration",
  "other",
] as const;

export const CONTACT_SOURCES = ["contact", "checkout", "order"] as const;

export const CONTACT_MESSAGE_STATUSES = ["new", "resolved"] as const;

export const CONTACT_BODY_MAX = 2000;
export const CONTACT_REPLY_TO_MAX = 120;
