export type PaymentMode = "manual_card" | "gateway";

export type PaymentProvider = "manual_card" | "zarinpal";

export interface ManualCardDetails {
  cardNumber: string;
  cardHolder: string;
  bankName?: string;
}

export type PaymentStartResult =
  | { kind: "redirect"; redirectUrl: string; provider: PaymentProvider }
  | {
      kind: "manual_card";
      provider: PaymentProvider;
      card: ManualCardDetails;
    };

function readMode(): PaymentMode {
  const raw = (process.env.PAYMENT_MODE || "manual_card").trim().toLowerCase();
  return raw === "gateway" || raw === "zarinpal" ? "gateway" : "manual_card";
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function formatCardNumber(value: string) {
  const digits = digitsOnly(value);
  return digits.replace(/(\d{4})(?=\d)/g, "$1-");
}

export function paymentMode(): PaymentMode {
  return readMode();
}

export function paymentProvider(): PaymentProvider {
  return paymentMode() === "gateway" ? "zarinpal" : "manual_card";
}

export function manualCardDetails(): ManualCardDetails {
  const cardNumber = formatCardNumber(
    process.env.PAYMENT_CARD_NUMBER || "6037998155667788",
  );
  const cardHolder =
    process.env.PAYMENT_CARD_HOLDER?.trim() || "استودیو رَد";
  const bankName = process.env.PAYMENT_CARD_BANK?.trim() || undefined;
  return { cardNumber, cardHolder, bankName };
}

/**
 * Start payment for a reserved order.
 * Today: returns manual card instructions (no redirect).
 * Later: call a PaymentGateway adapter from services/payment/contracts
 * and return `{ kind: "redirect", redirectUrl }`.
 */
export function startPaymentSession(_input: {
  orderId: string;
  amount: number;
  currency: "IRR" | "USD";
  callbackUrl: string;
}): PaymentStartResult {
  if (paymentMode() === "gateway") {
    // Hook point for Zarinpal (or other) PaymentGateway.create(...)
    throw new Error(
      "PAYMENT_MODE=gateway but no PaymentGateway adapter is configured yet. Set PAYMENT_MODE=manual_card until the gateway is wired.",
    );
  }

  return {
    kind: "manual_card",
    provider: "manual_card",
    card: manualCardDetails(),
  };
}
