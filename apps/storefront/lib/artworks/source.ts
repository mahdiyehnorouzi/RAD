import "server-only";

/**
 * Where the catalog comes from, set with CATALOG_SOURCE:
 * - `auto` (default outside production): the API, falling back to the bundled
 *   registry when it is unreachable.
 * - `api`: the API only; an outage surfaces as an error page instead of registry data.
 * - `registry`: never calls the API, for working on pages without running it.
 *
 * In production this always resolves to `"api"`, regardless of
 * `CATALOG_SOURCE` — the static registry must never be shown to real
 * customers, not even during an API outage, so a misconfigured production
 * env file cannot silently re-enable it. `auto`/`registry` only apply
 * outside production (local dev, or an explicitly non-production
 * deployment), for working on pages without the API running.
 */
type CatalogSource = "auto" | "api" | "registry";

export function catalogSource(): CatalogSource {
  if (process.env.NODE_ENV === "production") return "api";
  const value = process.env.CATALOG_SOURCE;
  return value === "api" || value === "registry" ? value : "auto";
}

/** True when `catalogSource()` could ever return registry data (never in production). */
export function registryFallbackAllowed(): boolean {
  return process.env.NODE_ENV !== "production";
}
