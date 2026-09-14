import type { PaymentIntent } from "@rad/types";

export type PaymentMode = "manual_card" | "gateway";

export interface CreatePaymentInput {
  orderId: string;
  amount: number;
  currency: "IRR" | "USD";
  callbackUrl: string;
}

/** Live gateway adapter (e.g. Zarinpal). Browser never holds merchant credentials. */
export interface PaymentGateway {
  create(input: CreatePaymentInput): Promise<PaymentIntent & { redirectUrl: string }>;
  verify(authority: string): Promise<PaymentIntent>;
}

export interface ManualCardDetails {
  cardNumber: string;
  cardHolder: string;
  bankName?: string;
}

/**
 * Result of starting payment after inventory is reserved.
 * - `redirect` → send the browser to the gateway
 * - `manual_card` → show card details until the gateway is connected
 */
export type PaymentStartResult =
  | { kind: "redirect"; redirectUrl: string; provider: PaymentIntent["provider"] }
  | {
      kind: "manual_card";
      provider: PaymentIntent["provider"];
      card: ManualCardDetails;
    };

// A production adapter requires merchant credentials, signed callbacks and server-side verification.
// Flip PAYMENT_MODE=gateway and wire PaymentGateway once credentials are ready.
