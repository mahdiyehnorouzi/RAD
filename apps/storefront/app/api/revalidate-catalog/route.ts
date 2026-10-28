import { timingSafeEqual } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/catalog/catalog-tag";
import { resetProcessCatalogCache } from "@/lib/catalog/get-catalog-works";
import { LOCALES } from "@/lib/locale";

/**
 * Admin (a separate Next.js app/deployment) has no way to invalidate this
 * app's catalog cache on its own — `refreshCatalog`'s `updateTag` only
 * reaches this process. Admin calls this route after any product write
 * (publish, status change, delete) so the homepage and the rest of the
 * storefront stop serving a stale snapshot for the rest of the 30s window.
 */

/**
 * Best-effort, per-instance only: this edge runtime has no shared store
 * configured for a distributed limiter, so this only bounds abuse against
 * whichever instance happens to receive the request, not globally. It
 * exists to blunt casual secret-guessing traffic, not as the real defense —
 * the shared secret and its length are.
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
let windowStart = 0;
let windowCount = 0;

function rateLimited(): boolean {
  const now = Date.now();
  if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
    windowStart = now;
    windowCount = 0;
  }
  windowCount += 1;
  return windowCount > RATE_LIMIT_MAX;
}

function secretMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch rather than returning false.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secret = process.env.CATALOG_REVALIDATE_SECRET;
  if (!secret) {
    return Response.json(
      { ok: false, error: "not_configured" },
      { status: 503 },
    );
  }
  if (rateLimited()) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  if (!secretMatches(request.headers.get("x-revalidate-secret"), secret)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  updateTag(CATALOG_TAG);
  resetProcessCatalogCache();
  // Homepage is request-time (`force-dynamic`) but the locale layout still
  // prerenders `getCatalogIndex()`. Invalidate both the tagged fetch and the
  // layout so Admin product writes refresh Latest Works and the catalog index.
  revalidatePath("/", "layout");
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}`);
  }
  return Response.json(
    { ok: true },
    { headers: { "cache-control": "no-store" } },
  );
}
