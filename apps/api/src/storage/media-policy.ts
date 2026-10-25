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
  return { image: 3 * 1024 * 1024, video: Math.floor(videoMB * 1024 * 1024) };
}
export function validateMediaSize(bytes: number, kind: "image" | "video") {
  if (!Number.isSafeInteger(bytes) || bytes <= 0)
    throw new BadRequestException("فایل خالی یا نامعتبر است.");
  if (bytes > mediaLimits()[kind])
    throw new PayloadTooLargeException(
      `حجم ${kind === "video" ? "ویدیو" : "تصویر"} باید حداکثر ${new Intl.NumberFormat("fa").format(mediaLimits()[kind] / 1024 / 1024)} مگابایت باشد.`,
    );
}
