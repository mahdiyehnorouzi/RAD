import type { ContactMessage } from "../database/entities";
import type {
  AdminContactMessage,
  ContactMessageStatus,
  ContactSource,
  ContactTopic,
} from "./type";

export function toAdminContactMessage(
  message: ContactMessage,
): AdminContactMessage {
  return {
    id: message.id,
    topic: message.topic as ContactTopic,
    source: message.source as ContactSource,
    name: message.name,
    contact: message.contact,
    body: message.body,
    status: message.status as ContactMessageStatus,
    orderId: message.orderId ?? undefined,
    fromOrderOwner: message.fromOrderOwner,
    signedIn: Boolean(message.userId),
    createdAt: message.createdAt.getTime(),
    resolvedAt: message.resolvedAt?.getTime(),
  };
}
