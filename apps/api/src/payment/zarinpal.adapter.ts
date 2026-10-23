import { randomUUID } from "node:crypto";
import { Logger } from "@nestjs/common";

/**
 * ZarinPal REST API v4 (https://www.zarinpal.com/docs/paymentGateway/connectToGateway.html).
 * Amounts are sent in Toman (`currency: "IRT"`) since RAD's order totals are
 * already Toman — avoids a silent x10/÷10 mistake converting to Rial.
 *
 * `verify.json`'s own docs page does not state whether it honours `currency`
 * the way `request.json` does; we send it on both calls for consistency, but
 * — like everything else here — this is UNVERIFIED against a real ZarinPal
 * round trip. No sandbox request has actually been made against ZarinPal's
 * servers from this codebase; everything above the `fetch()` call in `post()`
 * is read from https://www.zarinpal.com/docs/paymentGateway/connectToGateway
 * and https://www.zarinpal.com/docs/paymentGateway/sandBox, not confirmed by
 * running it. Do not enable `PAYMENT_MODE=gateway` in production, or treat
 * this adapter as load-bearing, until a full sandbox round trip (request →
 * redirect → pay on ZarinPal's sandbox page → callback → verify) has
 * actually been run and the response shapes checked against what this file
 * assumes.
 */

const logger = new Logger("ZarinpalAdapter");

const LIVE_HOST = "https://payment.zarinpal.com";
/** Confirmed at https://www.zarinpal.com/docs/paymentGateway/sandBox. */
const SANDBOX_HOST = "https://sandbox.zarinpal.com";

/**
 * The sandbox docs say any v4 UUID works as `merchant_id` — there is no
 * single published "sandbox merchant id" to hardcode, so generate a fresh
 * one each boot. Sandbox authorities are documented to start with "S".
 */
const SANDBOX_MERCHANT_ID = randomUUID();

export class ZarinpalError extends Error {
  constructor(
    message: string,
    readonly code?: number,
  ) {
    super(message);
    this.name = "ZarinpalError";
  }
}

function sandboxMode() {
  const flag = process.env.ZARINPAL_SANDBOX?.trim().toLowerCase();
  if (flag === "true") return true;
  if (flag === "false") return false;
  // No explicit flag: sandbox unless a real merchant id is configured.
  return !process.env.ZARINPAL_MERCHANT_ID?.trim();
}

function host() {
  return sandboxMode() ? SANDBOX_HOST : LIVE_HOST;
}

function merchantId() {
  return process.env.ZARINPAL_MERCHANT_ID?.trim() || SANDBOX_MERCHANT_ID;
}

export function zarinpalConfigured() {
  return Boolean(process.env.ZARINPAL_MERCHANT_ID?.trim()) || sandboxMode();
}

export function zarinpalIsSandbox() {
  return sandboxMode();
}

type RequestResult = { authority: string; redirectUrl: string };

/** Starts a payment; throws {@link ZarinpalError} on any non-success response. */
export async function requestZarinpalPayment(input: {
  amountToman: number;
  callbackUrl: string;
  description: string;
  orderId: string;
  mobile?: string;
}): Promise<RequestResult> {
  if (sandboxMode()) {
    logger.warn(
      `Starting a SANDBOX ZarinPal session for order ${input.orderId} — ` +
        "no real money moves. This adapter has not been confirmed against a " +
        "real ZarinPal round trip; do not set ZARINPAL_MERCHANT_ID in " +
        "production until one has been run.",
    );
  }
  const body = {
    merchant_id: merchantId(),
    amount: input.amountToman,
    currency: "IRT",
    description: input.description,
    callback_url: input.callbackUrl,
    metadata: {
      order_id: input.orderId,
      ...(input.mobile ? { mobile: input.mobile } : {}),
    },
  };

  const payload = await post<{
    code: number;
    message: string;
    authority: string;
  }>(`${host()}/pg/v4/payment/request.json`, body);

  if (payload.code !== 100 || !payload.authority) {
    throw new ZarinpalError(
      payload.message || "درخواست پرداخت ناموفق بود.",
      payload.code,
    );
  }

  return {
    authority: payload.authority,
    redirectUrl: `${host()}/pg/StartPay/${payload.authority}`,
  };
}

type VerifyResult = { refId: string; cardPan?: string; alreadyVerified: boolean };

/**
 * Verifies a completed payment. Throws {@link ZarinpalError} for anything
 * other than code 100 (verified now) or 101 (already verified — idempotent).
 */
export async function verifyZarinpalPayment(input: {
  amountToman: number;
  authority: string;
}): Promise<VerifyResult> {
  const body = {
    merchant_id: merchantId(),
    amount: input.amountToman,
    currency: "IRT",
    authority: input.authority,
  };

  const payload = await post<{
    code: number;
    message: string;
    ref_id?: number | string;
    card_pan?: string;
  }>(`${host()}/pg/v4/payment/verify.json`, body);

  if (payload.code !== 100 && payload.code !== 101) {
    throw new ZarinpalError(
      payload.message || "تأیید پرداخت ناموفق بود.",
      payload.code,
    );
  }

  return {
    refId: String(payload.ref_id ?? ""),
    cardPan: payload.card_pan,
    alreadyVerified: payload.code === 101,
  };
}

async function post<T>(url: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    logger.error(
      `Request to ${url} failed: ${error instanceof Error ? error.message : error}`,
    );
    throw new ZarinpalError("ارتباط با درگاه پرداخت برقرار نشد.");
  }

  type ZarinpalErrorBody = { code?: number; message?: string; validations?: unknown };
  let json: { data?: T; errors?: ZarinpalErrorBody | unknown[] } | null = null;
  try {
    json = (await response.json()) as {
      data?: T;
      errors?: ZarinpalErrorBody | unknown[];
    };
  } catch {
    // fall through to the generic error below
  }

  if (!response.ok || !json?.data) {
    // ZarinPal returns the structured { code, message } that explains *why*
    // under `errors` (confirmed live against the sandbox: e.g. verify.json
    // on an unpaid session returns HTTP 401 with
    // errors: { code: -51, message: "Session is not active paid try." }).
    // None of ZarinPal's documented verify error codes are stated to mean
    // "definitely never paid" (https://www.zarinpal.com/docs/paymentGateway/errorList
    // explicitly recommends an inquiry/support check before letting the
    // customer pay again for any of them) — every one of these is still
    // "ambiguous" for retry-safety purposes, by design; this only improves
    // what gets logged, it does not change that.
    const errorBody =
      json?.errors && !Array.isArray(json.errors)
        ? (json.errors as ZarinpalErrorBody)
        : undefined;
    logger.error(
      `Zarinpal ${url} returned ${response.status}: ${JSON.stringify(json ?? {})}`,
    );
    throw new ZarinpalError(
      errorBody?.message
        ? `پاسخ نامعتبر از درگاه پرداخت: ${errorBody.message}`
        : "پاسخ نامعتبر از درگاه پرداخت دریافت شد.",
      errorBody?.code,
    );
  }

  return json.data;
}
