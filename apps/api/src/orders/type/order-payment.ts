export type OrderPaymentProvider = "sandbox" | "manual_card" | "zarinpal";

export type OrderPaymentStatus =
  | "created"
  | "redirected"
  | "submitted"
  | "verified"
  | "rejected"
  | "failed";

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
  submittedAt?: number;
  reviewedAt?: number;
  rejectionReason?: string;
  dueAt?: number;
};
