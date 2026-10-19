import type { ProductImageStorage } from "../database/entities/product-image.entity";

/**
 * Provider-independent contract for product image/video storage, extracted
 * from `CloudinaryStorageService`'s existing public shape so a future
 * provider (e.g. S3-compatible SeaweedFS) can be swapped in without
 * changing `AdminService` or any controller.
 *
 * Intentionally not a DI token/abstract class yet — this PR only extracts
 * the shape as a type. Consumers keep injecting `CloudinaryStorageService`
 * by concrete class for now; wiring a swappable provider is a later PR.
 */
export interface MediaStorage {
  /**
   * Signed params for a direct browser → storage upload, scoped to
   * `folder`. Implementations must never return their provider secret.
   */
  createSignedUpload(
    folder: string,
    kind?: "image" | "video",
    restricted?: boolean,
  ): Record<string, unknown>;

  /**
   * Re-derives provider-side metadata for an uploaded object and validates
   * it server-side (format, dimensions/decodability, size) — must never
   * trust client-supplied metadata alone.
   */
  verifyMedia(
    objectKey: string,
    kind: "image" | "video",
  ): Promise<{ objectKey: string; storage: ProductImageStorage }>;

  /** Best-effort delete of a stored object. */
  destroy(objectKey: string, resourceType?: "image" | "video"): Promise<void>;
}
