import { parseServerTimingDuration } from "./server-timing";

export const API_BASE =
  typeof window === "undefined"
    ? process.env.API_URL || "http://localhost:4000"
    : "/backend";

const timingEnabled =
  typeof window !== "undefined" && process.env.NODE_ENV !== "production";

type ApiError = { error?: string; message?: string };

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  // The browser's own monotonic clock, start to finish — never compared
  // against a timestamp from another machine (see server-timing.ts).
  const clientStart = timingEnabled ? performance.now() : 0;
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });
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
  const data = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok) {
    throw new Error(data.error || data.message || "Request failed");
  }
  return data;
}
