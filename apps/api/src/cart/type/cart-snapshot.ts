/** Mirrors `CartSnapshot` in `@rad/types`. */
export interface CartPriceAtAdd {
  toman: number;
  usd: number;
}

export interface CartPendingOrder {
  id: string;
  status: "pending_payment";
  /** Epoch ms. Null when an older order has no payment deadline yet. */
  paymentDueAt: number | null;
  slugs: string[];
}

export interface CartSnapshot {
  slugs: string[];
  holds: Record<string, number>;
  prices: Record<string, CartPriceAtAdd>;
  /** Unpaid orders that already took these works out of the bag. */
  pendingOrders: CartPendingOrder[];
}
