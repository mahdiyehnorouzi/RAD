export type PaymentMode = "manual_card" | "gateway";

export type PaymentProvider = "manual_card" | "zarinpal";

export interface ManualCardDetails {
  cardNumber: string;
  cardHolder: string;
  bankName?: string;
}

export type PaymentStartResult =
  | {
      kind: "redirect";
      redirectUrl: string;
      provider: PaymentProvider;
      authority: string;
    }
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
  const cardHolder = process.env.PAYMENT_CARD_HOLDER?.trim() || "استودیو رَد";
  const bankName = process.env.PAYMENT_CARD_BANK?.trim() || undefined;
  return { cardNumber, cardHolder, bankName };
}

/**
 * Start payment for an order whose works are held for the customer.
 * `PAYMENT_MODE=gateway` calls ZarinPal and returns a redirect; otherwise
 * returns manual card transfer instructions.
 */
export async function startPaymentSession(input: {
  orderId: string;
  amount: number;
  currency: "IRR" | "USD";
  callbackUrl: string;
  mobile?: string;
}): Promise<PaymentStartResult> {
  if (paymentMode() === "gateway") {
    const { requestZarinpalPayment } = await import("./zarinpal.adapter");
    const session = await requestZarinpalPayment({
      amountToman: input.amount,
      callbackUrl: input.callbackUrl,
      description: `سفارش رَد ${input.orderId}`,
      orderId: input.orderId,
      mobile: input.mobile,
    });
    return {
      kind: "redirect",
      redirectUrl: session.redirectUrl,
      provider: "zarinpal",
      authority: session.authority,
    };
  }

  return {
    kind: "manual_card",
    provider: "manual_card",
    card: manualCardDetails(),
  };
}
