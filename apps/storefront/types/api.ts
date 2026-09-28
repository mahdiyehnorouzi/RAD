import type { AuthUser, PolicyVersions } from "@rad/types";

export type SessionPayload = { user: AuthUser | null };
export type LoginInput = { email: string; password: string };
export type RegisterInput = { name: string; email: string; password: string };
export type PlaceOrderInput = {
  name?: string;
  city?: string;
  phone?: string;
  address?: string;
  /** The rule versions the buyer ticked at checkout; the API rejects stale ones. */
  acceptedPolicies?: PolicyVersions;
};

export type PaymentReceiptInput = {
  receiptImage: string;
  trackingNumber: string;
};
