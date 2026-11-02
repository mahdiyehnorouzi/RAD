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

/**
 * Who the bag baseline belongs to. A signed-in id wins; otherwise the
 * browser guest id. Null means we cannot persist without mixing visitors.
 */
export function visitorOwner(
  userId: string | null | undefined,
  guestId: string | null,
) {
  if (userId) return `user:${userId}`;
  if (guestId) return `guest:${guestId}`;
  return null;
}

export type SessionOwner =
  { known: false } | { known: true; owner: string | null };

/** `rad:session` carries the visitor id. Events without that detail are ignored. */
export function sessionOwnerFromEvent(
  detail: unknown,
  guestId: string | null,
): SessionOwner {
  if (!detail || typeof detail !== "object" || !("userId" in detail)) {
    return { known: false };
  }
  const userId = (detail as { userId?: unknown }).userId;
  if (userId === null)
    return { known: true, owner: visitorOwner(null, guestId) };
  if (typeof userId === "string") {
    return { known: true, owner: visitorOwner(userId, guestId) };
  }
  return { known: false };
}

/** A cart response belongs to the session that issued it. */
export function isCurrentCartEpoch(started: number, current: number) {
  return started === current;
}

/**
 * Cart reads and writes share one queue. The browser request gate only
 * serializes the first call, so a slow snapshot must not start after — or
 * finish over — a later add, remove, or clear.
 */
export function createCartQueue() {
  let tail: Promise<void> = Promise.resolve();
  return function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = tail.then(task, task);
    tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
}

export type BagMemory = {
  owner: string;
  slugs: string[];
  released: string[];
};

export type BagMemoryMode = "detect" | "keep" | "reset";

/**
 * Remembers the last bag this visitor saw, and which works left it.
 * A different owner never inherits that list.
 */
export function reconcileBagBaseline(
  memory: BagMemory | null,
  owner: string,
  nextSlugs: readonly string[],
  pendingOrders: readonly CartPendingOrder[],
  mode: BagMemoryMode,
): BagMemory {
  if (mode === "reset" || !memory || memory.owner !== owner) {
    return { owner, slugs: [...nextSlugs], released: [] };
  }
  const detected =
    mode === "detect"
      ? slugsThatLeftBag(memory.slugs, nextSlugs, pendingOrders)
      : [];
  const released = [...new Set([...memory.released, ...detected])].filter(
    (slug) => !nextSlugs.includes(slug),
  );
  return { owner, slugs: [...nextSlugs], released };
}

const BAG_KEY = "rad-cart-bag";
const LEGACY_KNOWN = "rad-cart-known";
const LEGACY_RELEASED = "rad-cart-released";

type BagStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function isStringList(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function bagMemoryFromUnknown(value: unknown): BagMemory | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.owner !== "string" || !record.owner) return null;
  if (!isStringList(record.slugs) || !isStringList(record.released))
    return null;
  return {
    owner: record.owner,
    slugs: record.slugs,
    released: record.released,
  };
}

/** Drops the old unscoped lists so a previous visitor's slugs cannot resurface. */
export function readBagMemory(storage: BagStorage): BagMemory | null {
  storage.removeItem(LEGACY_KNOWN);
  storage.removeItem(LEGACY_RELEASED);
  try {
    const raw = storage.getItem(BAG_KEY);
    if (!raw) return null;
    return bagMemoryFromUnknown(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function writeBagMemory(storage: BagStorage, memory: BagMemory) {
  storage.removeItem(LEGACY_KNOWN);
  storage.removeItem(LEGACY_RELEASED);
  try {
    storage.setItem(BAG_KEY, JSON.stringify(memory));
  } catch {
    /* private mode or quota */
  }
}
