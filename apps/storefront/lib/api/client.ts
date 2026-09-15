export const API_BASE =
  typeof window === "undefined"
    ? process.env.API_URL || "http://localhost:4000"
    : "/backend";

type ApiErrorBody = { error?: unknown; message?: unknown; code?: unknown };

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
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

export function errorMessage(err: unknown, fallback = "Request failed"): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof Error && err.message) return err.message;
  return firstString(err) ?? fallback;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const timeoutMs = 20_000;
  const controller = new AbortController();
  const external = init?.signal;
  const onExternalAbort = () => controller.abort(external?.reason);
  if (external) {
    if (external.aborted) controller.abort(external.reason);
    else external.addEventListener("abort", onExternalAbort, { once: true });
  }
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: "include",
      headers,
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => ({}))) as T & ApiErrorBody;
    if (!response.ok) {
      throw new ApiError(
        firstString(data.error) || firstString(data.message) || "Request failed",
        response.status,
        firstString(data.code),
      );
    }
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError("درخواست طولانی شد. دوباره تلاش کنید.", 408, "timeout");
    }
    throw err;
  } finally {
    clearTimeout(timer);
    external?.removeEventListener("abort", onExternalAbort);
  }
}
