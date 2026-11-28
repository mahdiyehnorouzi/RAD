import type { ProductImageStorage } from "../database/entities/product-image.entity";

/**
 * Common contract for the S3-compatible media storage service and the
 * shape `AdminService` codes against. The stable contract keeps storage
 * details out of callers.
 */
export interface MediaStorageService {
  /**
   * Params for direct browser-to-storage upload. The S3-compatible
   * implementation returns a presigned POST policy, passed through to the
   * client unchanged.
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
 * DI token for the S3-compatible service used to sign and verify new uploads.
 */
export const MEDIA_STORAGE = Symbol("MEDIA_STORAGE");

/**
 * DI token for a function that resolves the provider a *specific,
 * already-persisted* row's `storage` kind. Existing remote rows are
 * dispatched to the configured S3-compatible service for cleanup.
 */
export const MEDIA_STORAGE_RESOLVER = Symbol("MEDIA_STORAGE_RESOLVER");
export type MediaStorageResolver = (
  storage: ProductImageStorage,
) => MediaStorageService;

/**
 * Resolves persisted remote media to the S3-compatible storage service.
 */
export function createMediaStorageResolver(
  seaweedfs: MediaStorageService,
): MediaStorageResolver {
  return () => seaweedfs;
}

const VIDEO_STORAGES: readonly ProductImageStorage[] = ["seaweedfs_video"];

const REMOTE_STORAGES: readonly ProductImageStorage[] = [
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
