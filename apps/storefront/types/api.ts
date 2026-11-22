import type { CheckoutShippingMethod, PolicyVersions } from "@rad/types";

export type PlaceOrderInput = {
  name?: string;
  city?: string;
  phone?: string;
  address?: string;
  /** Optional note for RAD staff, shown only in admin order review. */
  message?: string;
  recipientName?: string;
  recipientPhone?: string;
  giftMessage?: string;
  /** The rule versions the buyer ticked at checkout; the API rejects stale ones. */
  acceptedPolicies?: PolicyVersions;
  /** Method only. The API quotes the fee; a client amount is ignored. */
  shippingMethod?: CheckoutShippingMethod;
};

export type PaymentReceiptInput = {
  receiptImage: string;
  trackingNumber?: string;
};
