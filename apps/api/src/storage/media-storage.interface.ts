import type { ProductImageStorage } from "../database/entities/product-image.entity";

/**
 * Common contract both storage providers (`CloudinaryStorageService`,
 * `SeaweedfsStorageService`) implement, and the shape `AdminService` codes
 * against. Keeping this provider-agnostic is what lets `StorageModule`
 * swap the active implementation behind `MEDIA_STORAGE_PROVIDER` without
 * touching any caller.
 */
export interface MediaStorageService {
  /**
   * Params for a direct browser → storage upload. The exact shape is
   * provider-specific (Cloudinary returns signed form fields for its own
   * REST upload endpoint; an S3-compatible provider returns a presigned
   * POST policy) — callers pass it through to the client unchanged.
   */
  createSignedUpload(
    folder: string,
    kind?: "image" | "video",
    restricted?: boolean,
  ): unknown;

  /** Confirms an uploaded object is real media of the expected kind. */
  verifyMedia(
    objectKey: string,
    kind: "image" | "video",
  ): Promise<{ objectKey: string; storage: ProductImageStorage }>;

  /** Best-effort delete; must be idempotent (missing object = success). */
  destroy(objectKey: string, resourceType?: "image" | "video"): Promise<void>;
}

/**
 * DI token `AdminService` injects instead of a concrete provider class —
 * the currently *active* provider (per `MEDIA_STORAGE_PROVIDER`), used
 * only for signing brand-new uploads. A brand-new upload's sign and
 * verify steps always agree on which provider is active (nothing else
 * could have signed it), so this is the right choice there.
 */
export const MEDIA_STORAGE = Symbol("MEDIA_STORAGE");

/**
 * DI token for a function that resolves the provider a *specific,
 * already-persisted* row's `storage` kind actually lives in — not
 * whichever provider is currently "active". Switching
 * `MEDIA_STORAGE_PROVIDER` doesn't migrate existing rows: a product
 * saved under Cloudinary keeps `storage: "cloudinary"` rows after the
 * switch flips to `"seaweedfs"`, so verifying or deleting an *existing*
 * row must dispatch by that row's own storage kind, never by whichever
 * provider happens to be active right now — otherwise a provider switch
 * would make every pre-existing Cloudinary row unverifiable (and orphan
 * cleanup would try to delete a Cloudinary asset from the SeaweedFS
 * bucket, or vice versa). See `AdminService.saveProduct`/`replaceImages`.
 */
export const MEDIA_STORAGE_RESOLVER = Symbol("MEDIA_STORAGE_RESOLVER");
export type MediaStorageResolver = (
  storage: ProductImageStorage,
) => MediaStorageService;

/**
 * Builds a `MediaStorageResolver` that dispatches a `seaweedfs`/
 * `seaweedfs_video` row to `seaweedfs` and everything else (including
 * `null`/legacy rows that never reach a resolver call in practice) to
 * `cloudinary` — pulled out of `storage.module.ts`'s DI factory so the
 * dispatch rule itself has a plain unit test independent of Nest's
 * container.
 */
export function createMediaStorageResolver(
  cloudinary: MediaStorageService,
  seaweedfs: MediaStorageService,
): MediaStorageResolver {
  return (storage) =>
    storage === "seaweedfs" || storage === "seaweedfs_video"
      ? seaweedfs
      : cloudinary;
}

const VIDEO_STORAGES: readonly ProductImageStorage[] = [
  "cloudinary_video",
  "seaweedfs_video",
];

const REMOTE_STORAGES: readonly ProductImageStorage[] = [
  "cloudinary",
  "cloudinary_video",
  "seaweedfs",
  "seaweedfs_video",
];

/** True for any storage kind backed by a signed-upload provider (as opposed to legacy_base64/static/external). */
export function isRemoteMediaStorage(
  storage: ProductImageStorage | null | undefined,
): boolean {
  return !!storage && REMOTE_STORAGES.includes(storage);
}

/** True for the video variant of either provider's storage kind. */
export function isVideoStorage(
  storage: ProductImageStorage | null | undefined,
): boolean {
  return !!storage && VIDEO_STORAGES.includes(storage);
}
