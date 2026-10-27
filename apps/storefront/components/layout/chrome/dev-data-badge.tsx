import { SERVER_API_URL } from "@/lib/api";
import { catalogSource } from "@/lib/artworks/server";
import { getCatalog } from "@/lib/catalog/get-catalog-works";
import "./dev-data-badge.css";

/**
 * Development only: which catalog the page was rendered from, so a registry
 * fallback is never mistaken for real Admin data.
 *
 * A fallback to the bundled demo registry gets a full-width, unmissable
 * top banner (not just a small corner badge) — it was too easy to miss the
 * previous quiet pill and mistake demo products for the real Admin catalog.
 * Real API data still gets only the small, quiet corner badge.
 */
export async function DevDataBadge() {
  const { origin } = await getCatalog();
  const source = catalogSource();
  const apiHost = new URL(SERVER_API_URL).host;

  if (origin === "registry") {
    const reason =
      source === "registry"
        ? `CATALOG_SOURCE=registry was set explicitly`
        : `the API at ${apiHost} was unreachable (CATALOG_SOURCE=${source})`;
    return (
      <output className="dev-data-banner" role="status">
        ⚠ DEMO DATA — not the real Admin catalog ({reason}). Set{" "}
        <code>CATALOG_SOURCE=api</code> for real-data testing; a reachable
        API is required for it to fail visibly instead of showing this.
      </output>
    );
  }

  return (
    <output
      className="dev-data-badge is-api"
      title={`CATALOG_SOURCE=${source}, API_URL=${SERVER_API_URL}`}
    >
      {`API · ${apiHost}`}
    </output>
  );
}
