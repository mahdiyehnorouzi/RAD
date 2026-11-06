import assert from "node:assert/strict";
import { afterEach, describe, mock, test } from "node:test";
import { requestZarinpalPayment } from "./zarinpal.adapter";

const ENV_KEYS = [
  "NODE_ENV",
  "ZARINPAL_BASE_URL",
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

function stubFetch(capture: (url: string) => void) {
  mock.method(globalThis, "fetch", async (input: unknown) => {
    capture(String(input));
    return new Response(
      JSON.stringify({ data: { code: 100, authority: "A1" }, errors: [] }),
      { status: 200 },
    );
  });
}

describe("ZARINPAL_BASE_URL (RAD-134 local E2E override)", () => {
  test("unset: request.json still targets the real sandbox/live host", async () => {
    process.env.ZARINPAL_SANDBOX = "true";
    delete process.env.ZARINPAL_BASE_URL;
    let seenUrl = "";
    stubFetch((url) => (seenUrl = url));

    await requestZarinpalPayment({
      amountToman: 1000,
      callbackUrl: "https://example.com/cb",
      description: "d",
      orderId: "o1",
    });

    assert.match(seenUrl, /^https:\/\/sandbox\.zarinpal\.com\//);
  });

  test("set to a loopback host outside production: fetch targets the override", async () => {
    delete process.env.NODE_ENV;
    process.env.ZARINPAL_BASE_URL = "http://127.0.0.1:34567";
    let seenUrl = "";
    stubFetch((url) => (seenUrl = url));

    await requestZarinpalPayment({
      amountToman: 1000,
      callbackUrl: "https://example.com/cb",
      description: "d",
      orderId: "o1",
    });

    assert.match(seenUrl, /^http:\/\/127\.0\.0\.1:34567\//);
  });

  test("refused when NODE_ENV=production, even with a loopback host", async () => {
    process.env.NODE_ENV = "production";
    process.env.ZARINPAL_BASE_URL = "http://127.0.0.1:34567";
    stubFetch(() => {});

    await assert.rejects(
      () =>
        requestZarinpalPayment({
          amountToman: 1000,
          callbackUrl: "https://example.com/cb",
          description: "d",
          orderId: "o1",
        }),
      /not allowed when NODE_ENV=production/,
    );
  });

  test("refused for a non-loopback host, even outside production", async () => {
    delete process.env.NODE_ENV;
    process.env.ZARINPAL_BASE_URL = "https://not-a-real-gateway.example.com";
    stubFetch(() => {});

    await assert.rejects(
      () =>
        requestZarinpalPayment({
          amountToman: 1000,
          callbackUrl: "https://example.com/cb",
          description: "d",
          orderId: "o1",
        }),
      /must point at a local host/,
    );
  });
});
