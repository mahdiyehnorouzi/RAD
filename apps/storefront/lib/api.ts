export const API_BASE =
  typeof window === "undefined"
    ? process.env.API_URL || "http://localhost:4000"
    : "/backend";

type ApiError = { error?: string; message?: string };

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });
  const data = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok) {
    throw new Error(data.error || data.message || "Request failed");
  }
  return data;
}
