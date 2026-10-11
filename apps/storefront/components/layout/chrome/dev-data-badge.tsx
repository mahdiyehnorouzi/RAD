import { SERVER_API_URL } from "@/lib/api";
import { catalogSource } from "@/lib/artworks/server";
import { getCatalog, traceCatalogCall } from "@/lib/catalog/get-catalog-works";
import "./dev-data-badge.css";

/** Development only: which catalog the page was rendered from, so registry fallbacks are never mistaken for API data. */
export async function DevDataBadge() {
  // TEMP DIAGNOSTIC — remove after identifying catalog-fetch caller distribution
  // Dev-only (NODE_ENV === "development"); does not run during `next build`.
  traceCatalogCall("dev-data-badge");
  const { origin } = await getCatalog();
  const source = catalogSource();
  const label =
    origin === "api"
      ? `API · ${new URL(SERVER_API_URL).host}`
      : source === "registry"
        ? "Registry · CATALOG_SOURCE=registry"
        : "Registry · API unreachable";
  return (
    <output
      className={`dev-data-badge is-${origin}`}
      title={`CATALOG_SOURCE=${source}, API_URL=${SERVER_API_URL}`}
    >
      {label}
    </output>
  );
}
