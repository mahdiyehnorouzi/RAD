import type {
  ContactMessageInput,
  ContactMessageReceipt,
  ContactMessageThreadItem,
} from "@rad/types";
import { api } from "./client";

export async function sendContactMessage(input: ContactMessageInput) {
  return api<ContactMessageReceipt>("/contact/messages", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Every message thread (root + replies) tied to an order the visitor owns. */
export async function fetchOrderMessages(orderId: string) {
  return api<ContactMessageThreadItem[]>(
    `/contact/messages?orderId=${encodeURIComponent(orderId)}`,
  );
}

/** The customer's own reply into a thread they started, or own the order of. */
export async function replyToContactMessage(id: string, body: string) {
  return api<ContactMessageThreadItem[]>(`/contact/messages/${id}/reply`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}
