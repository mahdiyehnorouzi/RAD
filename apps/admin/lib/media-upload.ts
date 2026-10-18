/**
 * `/images/sign` response shape — a discriminated union on `provider` so
 * the request-building logic below can target whichever
 * `MEDIA_STORAGE_PROVIDER` the API is currently running (see
 * `apps/api/src/storage`). Both providers share `resourceType`/`limits`.
 */
export type SignedUpload =
  | {
      provider: "cloudinary";
      cloudName: string;
      apiKey: string;
      timestamp: number;
      folder: string;
      signature: string;
      allowed_formats?: string;
      overwrite?: boolean;
      resourceType: "image" | "video";
    }
  | {
      provider: "seaweedfs";
      url: string;
      fields: Record<string, string>;
      objectKey: string;
      resourceType: "image" | "video";
    };

/**
 * Builds the direct browser → storage upload request for whichever
 * provider signed `signed`. Pulled out of `useAdminWorkspace` so this
 * provider-specific request-shaping logic — the part most likely to
 * silently break when a provider changes its API — can be unit tested
 * without a DOM/XHR harness (`FormData`/`File` are plain Node globals).
 *
 *  - `cloudinary`: a signed form POST to Cloudinary's own upload
 *    endpoint. `CLOUDINARY_API_SECRET` never reaches this code; only the
 *    public `apiKey`/`cloudName` + a one-time signature do.
 *  - `seaweedfs`: a presigned S3 POST policy — `fields` already contains
 *    everything the request needs (including the exact object key as
 *    `fields.key`). `file` must be the last field appended (S3 ignores
 *    anything appended after it in the multipart body), and `Content-Type`
 *    must be sent as its own field — the signed policy only allows upload
 *    requests that include one — so `verifyMedia` can read back an
 *    accurate content type server-side.
 */
export function buildUploadRequest(
  signed: SignedUpload,
  file: File,
): { url: string; body: FormData } {
  const body = new FormData();
  if (signed.provider === "seaweedfs") {
    for (const [key, value] of Object.entries(signed.fields))
      body.append(key, value);
    body.append("Content-Type", file.type);
    body.append("file", file);
    return { url: signed.url, body };
  }
  body.append("file", file);
  body.append("api_key", signed.apiKey);
  for (const key of [
    "timestamp",
    "folder",
    "signature",
    "allowed_formats",
    "overwrite",
  ] as const)
    if (signed[key] !== undefined) body.append(key, String(signed[key]));
  return {
    url: `https://api.cloudinary.com/v1_1/${signed.cloudName}/${signed.resourceType}/upload`,
    body,
  };
}

/**
 * Resolves the uploaded object's key from a successful upload response.
 * A presigned S3 POST's object key was already minted by the API
 * (`signed.fields.key`/`signed.objectKey`) — SeaweedFS's success response
 * (typically 204, no body) has nothing to parse. Cloudinary mints the key
 * itself and only hands it back in the response body, so that branch
 * still has to parse it out.
 */
export function resolveUploadedObjectKey(
  signed: SignedUpload,
  responseText: string,
): string {
  if (signed.provider === "seaweedfs") return signed.objectKey;
  let result: unknown;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error("پاسخ بارگذاری معتبر نیست. دوباره تلاش کنید.");
  }
  const publicId = (result as { public_id?: unknown })?.public_id;
  if (typeof publicId !== "string" || !publicId)
    throw new Error("پاسخ بارگذاری معتبر نیست. دوباره تلاش کنید.");
  return publicId;
}
