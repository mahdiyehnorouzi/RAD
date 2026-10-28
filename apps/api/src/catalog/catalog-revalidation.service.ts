import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const NOTIFY_TIMEOUT_MS = 3_000;

/**
 * Tells the storefront its catalog cache is stale after a product write.
 * The storefront's own `refreshCatalog` server action only reaches its own
 * process's cache — Admin writes happen here, in a separate deployment, so
 * without this the homepage (and the rest of the storefront) can serve a
 * stale snapshot, including one frozen on an empty catalog, for up to the
 * full cache window after Admin publishes, sells or deletes a product.
 *
 * Best-effort: a failure here must never fail the admin write that
 * triggered it — the storefront's own time-based revalidation is still the
 * fallback.
 */
@Injectable()
export class CatalogRevalidationService {
  private readonly logger = new Logger(CatalogRevalidationService.name);

  constructor(private readonly config: ConfigService) {}

  async notifyChanged(): Promise<void> {
    const url = this.config.get<string>("STOREFRONT_REVALIDATE_URL");
    const secret = this.config.get<string>("CATALOG_REVALIDATE_SECRET");
    if (!url || !secret) return;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "x-revalidate-secret": secret },
        signal: AbortSignal.timeout(NOTIFY_TIMEOUT_MS),
      });
      if (!response.ok) {
        this.logger.warn(
          `Catalog revalidation notify failed: ${response.status}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Catalog revalidation notify failed: ${(error as Error).message}`,
      );
    }
  }
}
