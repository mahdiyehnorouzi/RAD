import type { CartPendingOrder } from "@rad/types";

/** A work that left the bag because it moved onto an unpaid order was not released. */
export function slugsThatLeftBag(
  previous: readonly string[] | null,
  nextSlugs: readonly string[],
  pendingOrders: readonly CartPendingOrder[],
): string[] {
  if (!previous?.length) return [];
  const stillHeld = new Set<string>(nextSlugs);
  for (const order of pendingOrders) {
    if (order.status !== "pending_payment") continue;
    for (const slug of order.slugs) stillHeld.add(slug);
  }
  return previous.filter((slug) => !stillHeld.has(slug));
}

/** The viewer's own unpaid order for this work, if the payment window is still open. */
export function pendingOrderForSlug(
  orders: readonly CartPendingOrder[] | undefined,
  slug: string,
  now = Date.now(),
): CartPendingOrder | null {
  if (!orders?.length) return null;
  return (
    orders.find(
      (order) =>
        order.status === "pending_payment" &&
        order.slugs.includes(slug) &&
        (order.paymentDueAt == null || order.paymentDueAt > now),
    ) ?? null
  );
}

/** bfcache restores the page without re-running effects. Always re-read the bag. */
export function shouldReloadBagOnPageShow() {
  return true;
}
