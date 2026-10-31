/**
 * Where "I'll pay later" sends the buyer.
 *
 * Checkout has already created the order and cleared the cart, so this must
 * be the existing order page. That page resumes manual receipt or gateway
 * payment only while the order is still `pending_payment` and inside the
 * payment window. It does not create an order and it does not restock.
 */
export function payLaterPath(orderId: string) {
  const id = orderId.trim();
  if (!id) throw new Error("pay later requires an order id");
  return `/orders/${encodeURIComponent(id)}`;
}

export type PayLaterInput = {
  orderId: string;
  status: string;
  /** True when the payment deadline has passed, even if the sweep has not flipped status yet. */
  expired: boolean;
  gateway: boolean;
  hasLiveRedirect: boolean;
  receiptStep: boolean;
};

export type PayLaterOffer =
  | { offer: true; href: string }
  | {
      offer: false;
      reason:
        | "not-payable"
        | "expired"
        | "gateway"
        | "awaiting-redirect"
        | "receipt-step";
    };

/**
 * The manual-card transfer step is the only place this control appears.
 * Other states stay on their existing checkout or order screens.
 */
export function payLaterOffer(input: PayLaterInput): PayLaterOffer {
  if (input.status !== "pending_payment") {
    return { offer: false, reason: "not-payable" };
  }
  if (input.expired) return { offer: false, reason: "expired" };
  if (input.receiptStep) return { offer: false, reason: "receipt-step" };
  if (input.hasLiveRedirect) {
    return { offer: false, reason: "awaiting-redirect" };
  }
  if (input.gateway) return { offer: false, reason: "gateway" };
  return { offer: true, href: payLaterPath(input.orderId) };
}

/** Receipt and gateway buttons on the order page. False means show the closed state only. */
export function canContinuePayment(input: {
  status: string;
  dueAt?: number | null;
  now: number;
}) {
  if (input.status !== "pending_payment") return false;
  if (input.dueAt != null && input.dueAt <= input.now) return false;
  return true;
}
