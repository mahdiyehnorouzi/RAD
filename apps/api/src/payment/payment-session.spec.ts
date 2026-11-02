import assert from "node:assert/strict";
import { afterEach, describe, mock, test } from "node:test";
import {
  manualCardDetails,
  manualPaymentConfigFingerprint,
  paymentMode,
  paymentProvider,
  startPaymentSession,
} from "./payment-session";

const ENV_KEYS = [
  "PAYMENT_MODE",
  "PAYMENT_CARD_NUMBER",
  "PAYMENT_CARD_HOLDER",
  "PAYMENT_CARD_BANK",
  "ZARINPAL_SANDBOX",
  "ZARINPAL_MERCHANT_ID",
] as const;

const original = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);

afterEach(() => {
  mock.restoreAll();
  for (const key of ENV_KEYS) {
    const value = original[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("manual card configuration", () => {
  test("uses the configured holder and bank instead of a brand placeholder", () => {
    process.env.PAYMENT_MODE = "manual_card";
    process.env.PAYMENT_CARD_NUMBER = "6037 9981 5566 7788";
    process.env.PAYMENT_CARD_HOLDER = "مهدیه نوروزی";
    process.env.PAYMENT_CARD_BANK = "Saman Bank";

    const card = manualCardDetails();
    assert.equal(card.cardNumber, "6037-9981-5566-7788");
    assert.equal(card.cardHolder, "مهدیه نوروزی");
    assert.equal(card.bankName, "Saman Bank");
    assert.notEqual(card.cardHolder, "استودیو رَد");
  });

  test("fingerprint reports mode and completeness without card secrets", () => {
    process.env.PAYMENT_MODE = "manual_card";
    process.env.PAYMENT_CARD_NUMBER = "6037998155667788";
    process.env.PAYMENT_CARD_HOLDER = "مهدیه نوروزی";
    process.env.PAYMENT_CARD_BANK = "Saman Bank";

    const printed = JSON.stringify(manualPaymentConfigFingerprint());
    assert.equal(printed.includes("6037"), false);
    assert.equal(printed.includes("مهدیه"), false);
    assert.equal(printed.includes("Saman"), false);
    assert.deepEqual(manualPaymentConfigFingerprint(), {
      mode: "manual_card",
      provider: "manual_card",
      cardDigitCount: 16,
      holderConfigured: true,
      usesBrandHolderFallback: false,
      bankConfigured: true,
    });
  });
});

describe("payment-mode compatibility", () => {
  test("manual_card starts a card session and never calls ZarinPal", async () => {
    process.env.PAYMENT_MODE = "manual_card";
    process.env.PAYMENT_CARD_NUMBER = "6037998155667788";
    process.env.PAYMENT_CARD_HOLDER = "مهدیه نوروزی";
    let fetchCalls = 0;
    mock.method(globalThis, "fetch", async () => {
      fetchCalls += 1;
      return new Response("{}", { status: 500 });
    });

    const session = await startPaymentSession({
      orderId: "RAD-TEST",
      amount: 1_250_000,
      currency: "IRR",
      callbackUrl: "http://localhost:3000/checkout/RAD-TEST",
    });

    assert.equal(paymentMode(), "manual_card");
    assert.equal(paymentProvider(), "manual_card");
    assert.equal(session.kind, "manual_card");
    assert.equal(session.provider, "manual_card");
    if (session.kind !== "manual_card")
      throw new Error("expected card session");
    assert.equal(session.card.cardHolder, "مهدیه نوروزی");
    assert.equal(fetchCalls, 0);
  });

  test("gateway mode requests ZarinPal and does not return card details", async () => {
    process.env.PAYMENT_MODE = "gateway";
    process.env.ZARINPAL_SANDBOX = "true";
    process.env.PAYMENT_CARD_NUMBER = "6037998155667788";
    process.env.PAYMENT_CARD_HOLDER = "مهدیه نوروزی";

    mock.method(
      globalThis,
      "fetch",
      async (input: unknown, init?: RequestInit) => {
        const url = String(input);
        assert.match(url, /zarinpal\.com\/pg\/v4\/payment\/request\.json/);
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          amount: number;
          currency: string;
        };
        assert.equal(body.amount, 1_250_000);
        assert.equal(body.currency, "IRT");
        return new Response(
          JSON.stringify({
            data: {
              code: 100,
              message: "Success",
              authority: "S000000000000000000000000000000000000",
            },
            errors: [],
          }),
          { status: 200 },
        );
      },
    );

    const session = await startPaymentSession({
      orderId: "RAD-TEST",
      amount: 1_250_000,
      currency: "IRR",
      callbackUrl: "http://localhost:3000/checkout/RAD-TEST",
    });

    assert.equal(paymentMode(), "gateway");
    assert.equal(paymentProvider(), "zarinpal");
    assert.equal(session.kind, "redirect");
    if (session.kind !== "redirect") throw new Error("expected redirect");
    assert.equal(session.provider, "zarinpal");
    assert.ok(session.redirectUrl.includes("/pg/StartPay/"));
    assert.equal("card" in session, false);
  });
});
