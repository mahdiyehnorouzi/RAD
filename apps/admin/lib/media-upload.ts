/** Shape returned by the API for a signed S3-compatible upload. */
export type SignedUpload = {
  provider: "seaweedfs";
  url: string;
  fields: Record<string, string>;
  objectKey: string;
  resourceType: "image" | "video";
};

/** Build the direct browser-to-storage multipart request. */
export function buildUploadRequest(
  signed: SignedUpload,
  file: File,
): { url: string; body: FormData } {
  const body = new FormData();
  for (const [key, value] of Object.entries(signed.fields))
    body.append(key, value);
  body.append("Content-Type", file.type);
  body.append("file", file);
  return { url: signed.url, body };
}

/** A presigned S3 POST already has its object key; successful responses are often empty. */
export function resolveUploadedObjectKey(
  signed: SignedUpload,
  _responseText: string,
): string {
  return signed.objectKey;
}
