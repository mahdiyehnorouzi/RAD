export function filenameFromContentDisposition(
  header: string | null,
  fallback: string,
) {
  if (!header) return fallback;
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (encoded?.[1]) {
    try {
      return decodeURIComponent(encoded[1]);
    } catch {
      /* use the plain filename */
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(header);
  if (quoted?.[1]) return quoted[1];
  const plain = /filename=([^;]+)/i.exec(header);
  return plain?.[1]?.trim() || fallback;
}

export function invalidDownloadReason(input: {
  size: number;
  type: string;
  head: Uint8Array;
}) {
  if (input.size === 0) return "فایل دانلود خالی است.";
  const type = input.type.toLowerCase();
  if (type.includes("text/html") || type.includes("application/json")) {
    return "فایل دانلود نامعتبر است.";
  }
  const head = input.head;
  const png =
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47;
  const zip = head[0] === 0x50 && head[1] === 0x4b;
  const markup = head[0] === 0x3c;
  if (png || zip || markup) return null;
  return "فایل دانلود نامعتبر است.";
}

/** iOS Safari drops a blob click after an async fetch. Share the file instead. */
export function shouldShareDownload(userAgent: string, canShareFiles: boolean) {
  return /iP(hone|ad|od)/.test(userAgent) && canShareFiles;
}

export async function readDownload(
  response: {
    ok: boolean;
    blob: () => Promise<Blob>;
    headers: { get(name: string): string | null };
  },
  fallbackName: string,
): Promise<{ filename: string; blob: Blob } | { error: string }> {
  if (!response.ok) return { error: "دانلود انجام نشد. دوباره تلاش کنید." };
  const blob = await response.blob();
  const head = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
  const error = invalidDownloadReason({
    size: blob.size,
    type: blob.type,
    head,
  });
  if (error) return { error };
  return {
    blob,
    filename: filenameFromContentDisposition(
      response.headers.get("content-disposition"),
      fallbackName,
    ),
  };
}
