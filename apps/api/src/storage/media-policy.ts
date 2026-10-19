import { BadRequestException, PayloadTooLargeException } from "@nestjs/common";

export const MEDIA_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
] as const;
export function mediaLimits() {
  const videoMB = Number(process.env.PRODUCT_VIDEO_MAX_MB ?? 50);
  if (!Number.isFinite(videoMB) || videoMB <= 0 || videoMB > 100) {
    throw new Error("PRODUCT_VIDEO_MAX_MB must be between 0 and 100");
  }
  return { image: 2 * 1024 * 1024, video: Math.floor(videoMB * 1024 * 1024) };
}
export function validateMediaSize(bytes: number, kind: "image" | "video") {
  if (!Number.isSafeInteger(bytes) || bytes <= 0)
    throw new BadRequestException("فایل خالی یا نامعتبر است.");
  if (bytes > mediaLimits()[kind])
    throw new PayloadTooLargeException(
      `حجم ${kind === "video" ? "ویدیو" : "تصویر"} باید حداکثر ${new Intl.NumberFormat("fa").format(mediaLimits()[kind] / 1024 / 1024)} مگابایت باشد.`,
    );
}

/**
 * Sanity upper bound on decoded pixel dimensions, used only by
 * `S3StorageService.verifyMedia` (Cloudinary's Admin API already decodes
 * every upload itself, so a Cloudinary asset's reported dimensions are
 * never attacker-controlled the way a hand-parsed header value could be).
 * Not a claim that anything under this bound is safe to decode — see the
 * limitations noted in `media-signature.ts` — just a cheap rejection of
 * absurd/adversarial header values (e.g. a PNG IHDR claiming billions of
 * pixels) before that value is ever used for anything downstream, such as
 * a future thumbnailing step.
 */
export const MAX_IMAGE_DIMENSION_PX = 12_000;

/** Bounds for `S3_UPLOAD_URL_TTL_SECONDS` — guards against a misconfigured env value producing a near-permanent or instantly-expired signed URL. */
export const MIN_UPLOAD_URL_TTL_SECONDS = 60;
export const MAX_UPLOAD_URL_TTL_SECONDS = 3600;
