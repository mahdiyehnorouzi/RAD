import {
  isRemoteMediaStorage,
  isVideoStorage,
  type AdminProductImage,
} from "./admin-data";

export type CoverUploadState = {
  pending?: boolean;
  error?: string;
};

/**
 * Cover is the first persisted still image in gallery order (`sortOrder` 0
 * after save). Video cannot be the public or admin cover.
 */
export function isCoverableImage(image: AdminProductImage) {
  return !isVideoStorage(image.storage);
}

export function isPersistedImage(
  image: AdminProductImage,
  upload?: CoverUploadState,
) {
  if (upload?.pending || upload?.error) return false;
  if (isRemoteMediaStorage(image.storage)) return Boolean(image.objectKey);
  const src = image.src;
  if (!src) return false;
  return !src.startsWith("blob:");
}

export function canSelectAsCover(
  image: AdminProductImage,
  upload?: CoverUploadState,
) {
  return isCoverableImage(image) && isPersistedImage(image, upload);
}

export function coverImageIndex(
  images: AdminProductImage[],
  uploads: Record<string, CoverUploadState> = {},
) {
  return images.findIndex((image) =>
    canSelectAsCover(image, image.src ? uploads[image.src] : undefined),
  );
}

export function coverImage(
  images: AdminProductImage[],
  uploads: Record<string, CoverUploadState> = {},
) {
  const index = coverImageIndex(images, uploads);
  if (index >= 0) return images[index];
  return images.find(isCoverableImage);
}

export function selectAsCover(
  images: AdminProductImage[],
  index: number,
  uploads: Record<string, CoverUploadState> = {},
) {
  const image = images[index];
  const upload = image?.src ? uploads[image.src] : undefined;
  if (!image || !canSelectAsCover(image, upload)) return images;
  if (index === 0) return images;
  const next = [...images];
  const [cover] = next.splice(index, 1);
  return [cover, ...next];
}

export function selectAsCoverBySrc(
  images: AdminProductImage[],
  src: string,
  uploads: Record<string, CoverUploadState> = {},
) {
  const index = images.findIndex((image) => image.src === src);
  return index < 0 ? images : selectAsCover(images, index, uploads);
}

/** Short readable excerpt for dashboard/list cards; IDs stay elsewhere. */
export function briefExcerpt(text: string, maxChars = 88) {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars).trim()}…`;
}
