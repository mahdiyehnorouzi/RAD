const TRANSPARENT_PREFIX = "/catalog/photos/transparent/";

function imageSuffix(imageIndex: number) {
  return imageIndex === 0 ? "" : `-${imageIndex + 1}`;
}

export function catalogPhotoSrc(slug: string, imageIndex = 0) {
  return `${TRANSPARENT_PREFIX}${slug}${imageSuffix(imageIndex)}.webp`;
}

export function catalogLifestylePhotoSrc(slug: string, imageIndex = 0) {
  return `/catalog/photos/${slug}${imageSuffix(imageIndex)}.webp`;
}

/** Photographed in the studio: a transparent cut-out plus a lifestyle photo. */
export function hasStudioPhotos(work: {
  images?: readonly { src?: string }[];
}) {
  return Boolean(
    work.images?.some((image) => image.src?.startsWith(TRANSPARENT_PREFIX)),
  );
}
