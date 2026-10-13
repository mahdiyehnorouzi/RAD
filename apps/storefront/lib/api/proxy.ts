import { SERVER_API_URL } from "./client";
import { logRecovered } from "@/lib/log";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  // `fetch()` transparently gunzips the upstream body while handing us
  // `upstream.body` already decoded, so echoing a gzip `content-encoding`
  // (API responses over ~1KB get compressed — see compression.spec.ts)
  // would make the browser try to gunzip already-plain bytes and fail with
  // ERR_CONTENT_DECODING_FAILED. `content-length` is stale for the same
  // reason; the runtime recomputes it from the actual body we send.
  "content-encoding",
  "content-length",
]);

/**
 * The browser's own fetch may give up long before this; without an
 * independent deadline here a stalled Liara connection would otherwise hang
 * this Worker's outbound fetch indefinitely regardless of what the client
 * decided to wait for.
 */
const UPSTREAM_TIMEOUT_MS = 20_000;

/** Dev-only request timing; opt in elsewhere with RAD_PROXY_TIMING=1. Never logs headers, cookies, or bodies. */
const timingEnabled =
  process.env.NODE_ENV !== "production" || process.env.RAD_PROXY_TIMING === "1";

function logTiming(fields: Record<string, string | number | undefined>) {
  if (!timingEnabled) return;
  console.debug("[rad:proxy-timing]", fields);
}

function copyUpstreamHeaders(upstream: Response): Headers {
  const responseHeaders = new Headers();
  const getSetCookie = (
    upstream.headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie?.();

  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") return;
    if (!HOP_BY_HOP.has(key.toLowerCase())) responseHeaders.append(key, value);
  });

  if (getSetCookie?.length) {
    for (const cookie of getSetCookie)
      responseHeaders.append("set-cookie", cookie);
  } else {
    const single = upstream.headers.get("set-cookie");
    if (single) responseHeaders.append("set-cookie", single);
  }

  return responseHeaders;
}

/**
 * Composes the inbound request's own abort (the browser disconnected) with
 * an independent upstream timeout, so either one tears down the outbound
 * fetch. Exported so the timeout window and the resulting error shape can be
 * exercised directly from tests without a live network call.
 */
export function createUpstreamSignal(
  inboundSignal: AbortSignal,
  timeoutMs: number,
): { signal: AbortSignal; dispose: () => void } {
  const controller = new AbortController();
  const onInboundAbort = () => controller.abort(inboundSignal.reason);
  if (inboundSignal.aborted) controller.abort(inboundSignal.reason);
  else inboundSignal.addEventListener("abort", onInboundAbort, { once: true });

  const timer = setTimeout(
    () =>
      controller.abort(
        new DOMException("Upstream request timed out", "TimeoutError"),
      ),
    timeoutMs,
  );

  return {
    signal: controller.signal,
    dispose: () => {
      clearTimeout(timer);
      inboundSignal.removeEventListener("abort", onInboundAbort);
    },
  };
}

/** True once the signal aborted for the timeout, not because the client disconnected. */
export function isUpstreamTimeout(
  signal: AbortSignal,
  inboundSignal: AbortSignal,
): boolean {
  return (
    signal.aborted &&
    !inboundSignal.aborted &&
    signal.reason instanceof DOMException &&
    signal.reason.name === "TimeoutError"
  );
}

export async function proxyApiRequest(
  request: Request,
  pathSegments: string[],
): Promise<Response> {
  const path = pathSegments.map(encodeURIComponent).join("/");
  const target = new URL(`/${path}`, SERVER_API_URL);
  const incoming = new URL(request.url);
  target.search = incoming.search;

  const headers = new Headers(request.headers);
  headers.set("host", target.host);
  for (const key of HOP_BY_HOP) headers.delete(key);

  // The Web Crypto global, not node:crypto's randomUUID — this module is
  // reachable from a client-bundled import chain (lib/api's barrel), and a
  // node: built-in import there breaks the plain `next build --webpack`
  // path (vinext/rolldown merely warns and externalizes it, which hid this
  // until the stricter webpack build was run). crypto.randomUUID() is
  // standard Web Crypto, available in browsers, Node, and workerd alike.
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  headers.set("x-request-id", requestId);

  const method = request.method;
  const init: RequestInit & { duplex?: "half" } = {
    method,
    headers,
    redirect: "manual",
  };

  if (method !== "GET" && method !== "HEAD" && request.body) {
    init.body = request.body;
    init.duplex = "half";
  }

  const { signal, dispose } = createUpstreamSignal(
    request.signal,
    UPSTREAM_TIMEOUT_MS,
  );
  // A single clock (this Worker's own), read before and after the awaited
  // fetch — an elapsed duration, not a timestamp compared against another
  // machine's clock. Workers freeze Date.now() only across synchronous,
  // non-I/O execution (to close a Spectre-style timing side-channel); it
  // still advances correctly across an awaited I/O call like this fetch, so
  // this measures real wall time for the proxy-to-API leg. See
  // https://developers.cloudflare.com/workers/runtime-apis/web-standards/#high-resolution-time
  const proxyStart = Date.now();

  try {
    const upstream = await fetch(target, { ...init, signal });
    const proxyToApiMs = Date.now() - proxyStart;
    logTiming({
      requestId,
      method,
      path: `/${path}`,
      status: upstream.status,
      proxyToApiMs,
    });
    const responseHeaders = copyUpstreamHeaders(upstream);
    responseHeaders.set("x-request-id", requestId);
    if (timingEnabled) {
      // Standard Server-Timing header: reports a duration measured entirely
      // on this side, so the browser can line it up against its own
      // performance.now() total without ever subtracting one machine's
      // timestamp from another's.
      responseHeaders.append("server-timing", `proxy;dur=${proxyToApiMs}`);
    }
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const timedOut = isUpstreamTimeout(signal, request.signal);
    const proxyToApiMs = Date.now() - proxyStart;
    logRecovered("api proxy", error);
    logTiming({
      requestId,
      method,
      path: `/${path}`,
      status: timedOut ? "timeout" : "error",
      proxyToApiMs,
    });
    const errorHeaders: Record<string, string> = {
      "content-type": "application/json",
      "x-request-id": requestId,
    };
    if (timingEnabled)
      errorHeaders["server-timing"] = `proxy;dur=${proxyToApiMs}`;
    return Response.json(
      {
        error: timedOut ? "ارتباط با سرور طولانی شد." : "API unavailable",
        code: timedOut ? "timeout" : "upstream_unavailable",
      },
      { status: timedOut ? 504 : 503, headers: errorHeaders },
    );
  } finally {
    dispose();
  }
}
