import { updateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/catalog/catalog-tag";
import { resetProcessCatalogCache } from "@/lib/catalog/get-catalog-works";

/**
 * Admin (a separate Next.js app/deployment) has no way to invalidate this
 * app's catalog cache on its own — `refreshCatalog`'s `updateTag` only
 * reaches this process. Admin calls this route after any product write
 * (publish, status change, delete) so the homepage and the rest of the
 * storefront stop serving a stale snapshot for the rest of the 30s window.
 */
export async function POST(request: Request) {
  const secret = process.env.CATALOG_REVALIDATE_SECRET;
  if (!secret) {
    return Response.json(
      { ok: false, error: "not_configured" },
      { status: 503 },
    );
  }
  if (request.headers.get("x-revalidate-secret") !== secret) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  updateTag(CATALOG_TAG);
  resetProcessCatalogCache();
  return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
