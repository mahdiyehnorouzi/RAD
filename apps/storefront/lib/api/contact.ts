import type { ContactMessageInput, ContactMessageReceipt } from "@rad/types";
import { api } from "./client";

export async function sendContactMessage(input: ContactMessageInput) {
  return api<ContactMessageReceipt>("/contact/messages", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
