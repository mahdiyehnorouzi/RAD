import type { PolicyVersions } from "@rad/types";

export type PlaceOrderInput = {
  name?: string;
  city?: string;
  phone?: string;
  address?: string;
  /** Optional note for RAD staff, shown only in admin order review. */
  message?: string;
  /** The rule versions the buyer ticked at checkout; the API rejects stale ones. */
  acceptedPolicies?: PolicyVersions;
};

export type PaymentReceiptInput = {
  receiptImage: string;
  trackingNumber?: string;
};
