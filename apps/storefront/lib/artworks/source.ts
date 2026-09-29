import "server-only";

/**
 * Where the catalog comes from, set with CATALOG_SOURCE:
 * - `auto` (default): the API, falling back to the bundled registry when it is unreachable.
 * - `api`: the API only; an outage surfaces as an error page instead of registry data.
 * - `registry`: never calls the API, for working on pages without running it.
 */
type CatalogSource = "auto" | "api" | "registry";

export function catalogSource(): CatalogSource {
  const value = process.env.CATALOG_SOURCE;
  return value === "api" || value === "registry" ? value : "auto";
}
