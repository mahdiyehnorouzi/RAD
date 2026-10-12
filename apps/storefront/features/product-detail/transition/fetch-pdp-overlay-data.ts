import type { PdpData } from "@/lib/catalog/resolve-pdp-data";

type PdpOverlayResult =
  | { kind: "data"; data: PdpData }
  | { kind: "moved"; href: string }
  | { kind: "not_found" }
  | { kind: "error" };

const PER_ATTEMPT_TIMEOUT_MS = 12_000;
/** One retry only — this is a GET against an idempotent read, safe to repeat. */
const MAX_ATTEMPTS = 2;
/**
 * A hard ceiling independent of attempt count/per-attempt timeout, so the
 * overlay is guaranteed to resolve (to data or an error) by this deadline
 * regardless of how those two constants change later. Kept comfortably
 * under PER_ATTEMPT_TIMEOUT_MS * MAX_ATTEMPTS so the budget — not the retry
 * loop — is what actually bounds worst-case wait time.
 */
const OVERALL_BUDGET_MS = 18_000;

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

/**
 * The overlay's data fetch, split out so a stalled/failed request has a
 * bounded total wait, a single safe retry, and always resolves instead of
 * leaving the overlay waiting forever. `signal` is the caller's own — tied
 * to the effect cleanup — so navigating to a different product or closing
 * the overlay stops any in-flight attempt immediately rather than letting a
 * stale response land after the fact.
 */
export async function fetchPdpOverlayData(
  slug: string,
  signal: AbortSignal,
  fetchImpl: FetchLike = fetch,
): Promise<PdpOverlayResult> {
  // The browser's own monotonic-enough clock, read once at the start of this
  // call and only ever compared against itself — not a cross-machine value.
  const deadline = Date.now() + OVERALL_BUDGET_MS;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (signal.aborted) return { kind: "error" };
    const remaining = deadline - Date.now();
    if (remaining <= 0) return { kind: "error" };

    const controller = new AbortController();
    const onCallerAbort = () => controller.abort(signal.reason);
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener("abort", onCallerAbort, { once: true });
    const timer = setTimeout(
      () =>
        controller.abort(
          new DOMException("PDP overlay fetch timed out", "TimeoutError"),
        ),
      Math.min(PER_ATTEMPT_TIMEOUT_MS, remaining),
    );

    try {
      const response = await fetchImpl(`/api/pdp/${encodeURIComponent(slug)}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const payload = (await response.json()) as
        PdpData | { moved: string } | { error: string };
      if (!response.ok) {
        if ("error" in payload && payload.error === "not_found") {
          return { kind: "not_found" };
        }
        throw new Error("pdp_overlay_fetch_failed");
      }
      if ("moved" in payload) return { kind: "moved", href: payload.moved };
      if ("error" in payload) return { kind: "error" };
      return { kind: "data", data: payload };
    } catch {
      if (signal.aborted) return { kind: "error" }; // caller cancelled — do not retry
      if (attempt === MAX_ATTEMPTS || Date.now() >= deadline)
        return { kind: "error" };
      // fall through and retry once, budget permitting
    } finally {
      clearTimeout(timer);
      signal.removeEventListener("abort", onCallerAbort);
    }
  }
  return { kind: "error" };
}
