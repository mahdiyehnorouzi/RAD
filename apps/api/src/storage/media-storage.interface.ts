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

/** DI token `AdminService` injects instead of a concrete provider class. */
export const MEDIA_STORAGE = Symbol("MEDIA_STORAGE");

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
