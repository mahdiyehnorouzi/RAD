import type { Notice } from "@rad/types";

/**
 * Which `StageMessage` ids in `commissionId`'s conversation are still
 * unread, from this owner's own `notices` list (BUG-03). A
 * `commission_message` notice only exists for messages sent *to* this
 * owner (`CommissionsService.addArtistMessage` creates it for the
 * customer; the customer's own outgoing messages never get one), so
 * outgoing messages can never appear here.
 */
export function unreadMessageIds(
  notices: Notice[],
  commissionId: string,
): Set<string> {
  const ids = new Set<string>();
  for (const notice of notices) {
    if (
      !notice.read &&
      notice.kind === "commission_message" &&
      notice.productSlug === commissionId &&
      notice.messageId
    ) {
      ids.add(notice.messageId);
    }
  }
  return ids;
}
