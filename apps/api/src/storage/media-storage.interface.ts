import type { ProductImageStorage } from "../database/entities/product-image.entity";
import type { mediaLimits } from "./media-policy";

export type MediaLimits = ReturnType<typeof mediaLimits>;

/** Signed-upload payload shape for the Cloudinary provider (`CloudinaryStorageService`). */
export interface CloudinarySignedUpload {
  provider: "cloudinary";
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: number;
  signature: string;
  overwrite?: boolean;
  allowed_formats?: string;
  resourceType: "image" | "video";
  limits: MediaLimits;
}

/** Signed-upload payload shape for the S3-compatible provider (`S3StorageService`). */
export interface S3SignedUpload {
  provider: "s3";
  uploadUrl: string;
  method: "PUT";
  objectKey: string;
  resourceType: "image" | "video";
  limits: MediaLimits;
  expiresAt: number;
}

/**
 * Discriminated on `provider` so a caller (once one exists that handles
 * both) can narrow on `result.provider` instead of casting through
 * `Record<string, unknown>`. Extend this union, not either member's shape
 * directly, when a new provider is added.
 */
export type SignedUpload = CloudinarySignedUpload | S3SignedUpload;

/**
 * Provider-independent contract for product image/video storage, extracted
 * from `CloudinaryStorageService`'s existing public shape so a future
 * provider (e.g. S3-compatible SeaweedFS) can be swapped in without
 * changing `AdminService` or any controller.
 *
 * `createSignedUpload` is `Promise`-returning even though
 * `CloudinaryStorageService`'s HMAC signing needs no I/O and could be
 * synchronous: a presigned S3 PUT URL (`S3StorageService`) is inherently
 * async to generate, and a single shared interface needs one calling
 * convention. Making `CloudinaryStorageService.createSignedUpload` `async`
 * is a zero-behavior-change wrapper (a plain value returned from an async
 * method already resolves to that value, and every current caller already
 * either `await`s the result or is itself `async` and returns it onward,
 * which auto-flattens the resulting `Promise<Promise<T>>`) — see
 * `cloudinary-storage.spec.ts` for the updated (now-awaited) call sites.
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
  ): Promise<SignedUpload>;

  /**
   * Re-derives provider-side metadata for an uploaded object and validates
   * it server-side (format, dimensions/decodability, size) — must never
   * trust client-supplied metadata alone.
   *
   * Deliberately does NOT take a `productId`/ownership parameter: which
   * product (if any) an `objectKey` may legitimately belong to is an
   * authorization decision, not a storage-layer one, and both
   * implementations are key-content-only checks (does this exact object
   * exist and is it a valid image/video?). The integration layer
   * (`AdminService`, today via `isValidProductImagePublicId` /
   * `isValidS3ObjectKey`) MUST re-validate the key's namespace against the
   * resolved product before calling this, and again before persisting it
   * — `verifyMedia` alone is not an authorization check and must never be
   * treated as one.
   */
  verifyMedia(
    objectKey: string,
    kind: "image" | "video",
  ): Promise<{ objectKey: string; storage: ProductImageStorage }>;

  /** Best-effort delete of a stored object. */
  destroy(objectKey: string, resourceType?: "image" | "video"): Promise<void>;
}
