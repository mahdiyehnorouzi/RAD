/**
 * What a visitor wants to talk about. Mirrored by `CONTACT_TOPICS` in the
 * API (CommonJS cannot import this package).
 */
export const CONTACT_TOPICS = [
  "custom",
  "order",
  "payment",
  "collaboration",
  "other",
] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

/** Where the message was written: the contact page or an in-flow help panel. */
export const CONTACT_SOURCES = ["contact", "checkout", "order"] as const;
export type ContactSource = (typeof CONTACT_SOURCES)[number];

export const CONTACT_MESSAGE_STATUSES = ["new", "resolved"] as const;
export type ContactMessageStatus = (typeof CONTACT_MESSAGE_STATUSES)[number];

export interface ContactMessageInput {
  topic: ContactTopic;
  source: ContactSource;
  /** Email or phone RAD should reply to; the order owner may leave it out. */
  contact?: string;
  body: string;
  /** Links the message to a shop order so staff see it beside that order. */
  orderId?: string;
}

export interface ContactMessageReceipt {
  id: string;
  createdAt: number;
  orderId?: string;
}
