import { api } from "./client";

export async function createDesign(
  prompt: string,
  signal?: AbortSignal,
): Promise<{ image: string }> {
  return api<{ image: string }>("/design", {
    method: "POST",
    body: JSON.stringify({ prompt }),
    signal,
  });
}
