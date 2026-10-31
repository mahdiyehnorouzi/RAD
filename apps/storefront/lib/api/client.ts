import { withCurrentAssetPaths } from "@/lib/media/legacy-assets";
import { browserGuestId } from "./guest-id";
import { createRequestGate } from "./request-gate";
import { parseServerTimingDuration } from "./server-timing";

const timingEnabled =
  typeof window !== "undefined" && process.env.NODE_ENV !== "production";

/** Where server code reaches the API; browsers go through the /backend proxy. */
export const SERVER_API_URL = process.env.API_URL || "http://localhost:4000";

const API_BASE = typeof window === "undefined" ? SERVER_API_URL : "/backend";

/** Browser-only. Server renders must not share one guest across visitors. */
const browserSession = createRequestGate();

type ApiErrorBody = {
  error?: unknown;
  message?: unknown;
  code?: unknown;
  orderId?: unknown;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  orderId?: string;

  constructor(
    message: string,
    status: number,
    code?: string,
    orderId?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.orderId = orderId;
  }
}

function firstString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) return firstString(value[0]);
  if (value && typeof value === "object" && "message" in value) {
    return firstString((value as { message?: unknown }).message);
  }
  return undefined;
}

/** The request never reached the API: offline, DNS, dropped connection or timeout. */
export function isNetworkError(err: unknown) {
  return (
    err instanceof ApiError &&
    (err.code === "network" || err.code === "timeout")
  );
}

export function isSessionExpired(err: unknown) {
  return err instanceof ApiError && err.status === 401;
}

export function errorMessage(
  err: unknown,
  fallback = "Request failed",
): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof Error && err.message) return err.message;
  return firstString(err) ?? fallback;
}

/**
 * The API writes its own refusals in Persian; anything else (validator
 * output, stack text, network codes) is swapped for `fallback`.
 */
export function readableErrorMessage(err: unknown, fallback: string): string {
  if (isNetworkError(err)) return fallback;
  const message = errorMessage(err, fallback);
  return /[\u0600-\u06FF]/.test(message) ? message : fallback;
}

export async function api<T>(
  path: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const guestId = browserGuestId();
  if (guestId && !headers.has("x-rad-guest")) {
    headers.set("x-rad-guest", guestId);
  }
  const { timeoutMs = 20_000, ...fetchInit } = init ?? {};
  const controller = new AbortController();
  const external = fetchInit.signal;
  const onExternalAbort = () => controller.abort(external?.reason);
  if (external) {
    if (external.aborted) controller.abort(external.reason);
    else external.addEventListener("abort", onExternalAbort, { once: true });
  }
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  // The browser's own monotonic clock, start to finish — never compared
  // against a timestamp from another machine (see server-timing.ts).
  const clientStart = timingEnabled ? performance.now() : 0;
  const send = () =>
    fetch(`${API_BASE}${path}`, {
      ...fetchInit,
      credentials: "include",
      headers,
      signal: controller.signal,
    });
  try {
    const response =
      typeof window === "undefined" ? await send() : await browserSession(send);
    if (timingEnabled) {
      const totalMs = performance.now() - clientStart;
      const proxyMs = parseServerTimingDuration(
        response.headers.get("server-timing"),
        "proxy",
      );
      console.debug("[rad:client-timing]", {
        path,
        status: response.status,
        totalMs: Math.round(totalMs),
        proxyMs,
        networkMs:
          proxyMs !== undefined ? Math.round(totalMs - proxyMs) : undefined,
      });
    }
    const data = (await response.json().catch(() => ({}))) as T & ApiErrorBody;
    if (!response.ok) {
      throw new ApiError(
        firstString(data.error) ||
          firstString(data.message) ||
          "Request failed",
        response.status,
        firstString(data.code),
        firstString(data.orderId),
      );
    }
    return withCurrentAssetPaths(data);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(
        "درخواست طولانی شد. دوباره تلاش کنید.",
        408,
        "timeout",
      );
    }
    if (err instanceof TypeError) {
      throw new ApiError(
        "اتصال به اینترنت برقرار نیست. دوباره تلاش کنید.",
        0,
        "network",
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
    external?.removeEventListener("abort", onExternalAbort);
  }
}
