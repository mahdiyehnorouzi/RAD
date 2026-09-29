const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
/** Commission briefs drop data-URLs above 120k chars; stay safely under it. */
const MAX_DATA_URL_CHARS = 110_000;
const EDGES = [1600, 1280, 1024, 800, 640, 480];
const QUALITIES = [0.82, 0.7, 0.6];

type PrepareImageResult =
  | { ok: true; dataUrl: string }
  | { ok: false; reason: "type" | "size" | "corrupt" | "failed" };

async function decode(
  file: File,
): Promise<CanvasImageSource & { width: number; height: number }> {
  if ("createImageBitmap" in window) return createImageBitmap(file);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Validates a reference image and re-encodes it as a JPEG data-URL small
 * enough to survive the commission upload intact.
 */
export async function prepareImage(file: File): Promise<PrepareImageResult> {
  if (!ACCEPTED_TYPES.includes(file.type)) return { ok: false, reason: "type" };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, reason: "size" };

  let source: Awaited<ReturnType<typeof decode>>;
  try {
    source = await decode(file);
  } catch {
    return { ok: false, reason: "corrupt" };
  }
  if (!source.width || !source.height) return { ok: false, reason: "corrupt" };

  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return { ok: false, reason: "failed" };
    let smallest = "";
    for (const edge of EDGES) {
      const scale = Math.min(1, edge / Math.max(source.width, source.height));
      canvas.width = Math.max(1, Math.round(source.width * scale));
      canvas.height = Math.max(1, Math.round(source.height * scale));
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
      for (const quality of QUALITIES) {
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        if (dataUrl.length <= MAX_DATA_URL_CHARS) return { ok: true, dataUrl };
        smallest = dataUrl;
      }
    }
    return smallest.length <= MAX_DATA_URL_CHARS
      ? { ok: true, dataUrl: smallest }
      : { ok: false, reason: "size" };
  } catch {
    return { ok: false, reason: "failed" };
  } finally {
    if ("close" in source && typeof source.close === "function") source.close();
  }
}
