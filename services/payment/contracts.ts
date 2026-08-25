import type { PaymentIntent } from "@rad/types";

export interface CreatePaymentInput { orderId: string; amount: number; currency: "IRR" | "USD"; callbackUrl: string; }
export interface PaymentGateway {
  create(input: CreatePaymentInput): Promise<PaymentIntent & { redirectUrl: string }>;
  verify(authority: string): Promise<PaymentIntent>;
}

// A production adapter requires merchant credentials, signed callbacks and server-side verification.
