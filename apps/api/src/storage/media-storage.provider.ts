import type { MediaStorage } from "./media-storage.interface";
import type { CloudinaryStorageService } from "./cloudinary-storage.service";
import type { S3StorageService } from "./s3-storage.service";

export const MEDIA_STORAGE_PROVIDERS = ["cloudinary", "s3"] as const;
export type MediaStorageProviderName = (typeof MEDIA_STORAGE_PROVIDERS)[number];

/**
 * Parses `MEDIA_STORAGE_PROVIDER`. Defaults to `"cloudinary"` only when
 * the variable is genuinely unset (`undefined`) — preserving today's
 * behavior for every existing deployment that has never heard of this
 * variable. Any OTHER value that isn't exactly `"cloudinary"` or `"s3"`
 * (a typo, blank string, unrelated leftover value) throws rather than
 * silently defaulting — an explicit, unrecognized value is a
 * misconfiguration to surface at startup, not a cue to fall back.
 */
export function resolveMediaStorageProviderName(
  raw: string | undefined,
): MediaStorageProviderName {
  if (raw === undefined) return "cloudinary";
  const value = raw.trim().toLowerCase();
  if ((MEDIA_STORAGE_PROVIDERS as readonly string[]).includes(value)) {
    return value as MediaStorageProviderName;
  }
  throw new Error(
    `MEDIA_STORAGE_PROVIDER must be one of ${MEDIA_STORAGE_PROVIDERS.join(", ")} — got "${raw}". Refusing to start with an unrecognized value rather than silently defaulting to cloudinary.`,
  );
}

/**
 * Selects the active `MediaStorage` implementation. When `"s3"` is
 * selected, eagerly validates its configuration (`validateStartupConfig`)
 * so a misconfigured S3 provider fails NestJS bootstrap immediately
 * rather than lazily on the first real admin upload — and, critically,
 * never falls back to Cloudinary in that case; the thrown error
 * propagates and startup fails, by design.
 */
export function selectMediaStorageProvider(
  providerName: MediaStorageProviderName,
  cloudinary: CloudinaryStorageService,
  s3: S3StorageService,
): MediaStorage {
  if (providerName === "s3") {
    s3.validateStartupConfig();
    return s3;
  }
  return cloudinary;
}
