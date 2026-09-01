const allowedImage = /^data:image\/(jpeg|png|webp);base64,/i;

export function imageDataBytes(src: string) {
  const base64 = src.split(",")[1] ?? "";
  return Math.floor((base64.length * 3) / 4);
}

export function assertImageData(src: string, maxBytes: number, message: string) {
  if (!allowedImage.test(src)) {
    throw new Error(message);
  }
  const bytes = imageDataBytes(src);
  if (bytes === 0 || bytes > maxBytes) {
    throw new Error(message);
  }
}

export const productImageLimit = 2 * 1024 * 1024;
export const productImageError =
  "فقط تصویر JPEG، PNG یا WebP تا ۲ مگابایت مجاز است.";
