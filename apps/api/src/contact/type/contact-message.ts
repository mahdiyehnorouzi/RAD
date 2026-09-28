import type {
  CONTACT_MESSAGE_STATUSES,
  CONTACT_SOURCES,
  CONTACT_TOPICS,
} from "../const";

export type ContactTopic = (typeof CONTACT_TOPICS)[number];
export type ContactSource = (typeof CONTACT_SOURCES)[number];
export type ContactMessageStatus = (typeof CONTACT_MESSAGE_STATUSES)[number];

/** A message as staff see it in the admin inbox and beside its order. */
export type AdminContactMessage = {
  id: string;
  topic: ContactTopic;
  source: ContactSource;
  name: string;
  contact: string;
  body: string;
  status: ContactMessageStatus;
  orderId?: string;
  fromOrderOwner: boolean;
  signedIn: boolean;
  createdAt: number;
  resolvedAt?: number;
};
