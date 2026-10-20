import "server-only";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

/**
 * Where the catalog comes from, set with CATALOG_SOURCE:
 * - `auto` (default outside production runtime): the API, falling back to
 *   the bundled registry when it is unreachable.
 * - `api`: the API only; an outage surfaces as an error page instead of registry data.
 * - `registry`: never calls the API, for working on pages without running it.
 *
 * At production RUNTIME (a deployed server actually handling requests) this
 * always resolves to `"api"`, regardless of `CATALOG_SOURCE` — the static
 * registry must never be shown to a real customer, not even during an API
 * outage, so a misconfigured production env file cannot silently re-enable
 * it. `auto`/`registry` still apply during `next build`'s own static-
 * generation phase: `NODE_ENV` is `"production"` there too (that's just how
 * Next.js builds), but nothing is served to a customer yet, and
 * `generateStaticParams`'s build-time fetches legitimately need the
 * registry fallback to tolerate a handful of per-product prerender
 * failures against the live API (see `app/[locale]/products/[slug]/page.tsx`).
 * `process.env.NEXT_PHASE` distinguishes the two; it is unset outside `next
 * build`, so runtime behavior is unaffected by this exception.
 */
type CatalogSource = "auto" | "api" | "registry";

function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD
  );
}

export function catalogSource(): CatalogSource {
  if (isProductionRuntime()) return "api";
  const value = process.env.CATALOG_SOURCE;
  return value === "api" || value === "registry" ? value : "auto";
}

/** True when `catalogSource()` could ever return registry data (never at production runtime). */
export function registryFallbackAllowed(): boolean {
  return !isProductionRuntime();
}
