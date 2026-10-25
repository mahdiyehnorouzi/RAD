export type OrderPaymentProvider = "sandbox" | "manual_card" | "zarinpal";

export type OrderPaymentStatus =
  | "created"
  | "redirected"
  | "submitted"
  | "verified"
  | "rejected"
  | "failed"
  /** Gateway didn't respond, or responded ambiguously — safe to retry verify. */
  | "verify_error"
  /** Gateway verified the charge after the reservation was already lost; needs manual reconciliation. */
  | "verify_conflict";

export type OrderPayment = {
  mode: "manual_card" | "gateway";
  provider: OrderPaymentProvider;
  status: OrderPaymentStatus;
  amount: number;
  manualCard?: {
    cardNumber: string;
    cardHolder: string;
    bankName?: string;
  };
  redirectUrl?: string;
  receiptImage?: string;
  trackingNumber?: string;
  /** ZarinPal reference number once a gateway payment is verified. */
  gatewayRefId?: string;
  submittedAt?: number;
  reviewedAt?: number;
  verifiedAt?: number;
  rejectionReason?: string;
  dueAt?: number;
};
