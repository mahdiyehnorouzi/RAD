import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  MAX_IMAGE_DIMENSION_PX,
  MAX_UPLOAD_URL_TTL_SECONDS,
  MIN_UPLOAD_URL_TTL_SECONDS,
  mediaLimits,
  validateMediaSize,
} from "./media-policy";
import { mintS3ObjectKey } from "./s3-object-key";
import { looksLikeMp4, looksLikeWebm, sniffImage } from "./media-signature";
import type { MediaStorage, S3SignedUpload } from "./media-storage.interface";
import type { ProductImageStorage } from "../database/entities/product-image.entity";

/**
 * Head/tail slice sizes read for video container validation. Large enough
 * to contain `ftyp`+`moov` for the vast majority of real files without
 * ever reading a whole (up to `PRODUCT_VIDEO_MAX_MB`, default 50MB) video
 * into process memory — deliberately bounded for the ~2GB-RAM production
 * VPS this is meant to run on.
 */
const VIDEO_PROBE_CHUNK_BYTES = 256 * 1024;

/**
 * S3-compatible (SeaweedFS) implementation of product image/video storage.
 *
 * Not wired into `StorageModule` by this PR — `CloudinaryStorageService`
 * remains the sole active provider; nothing here is reachable from
 * `AdminService`/`AdminController`/the admin or storefront frontends yet.
 * See this PR's report for the follow-up steps needed to actually switch
 * providers (primarily: wiring `isValidS3ObjectKey` into `AdminService`
 * exactly where it already calls `isValidProductImagePublicId`).
 *
 * Security model, by requirement:
 * - The object key a client ends up writing to is minted here, server-side,
 *   from `crypto.randomBytes` (`mintS3ObjectKey`) — never client-supplied —
 *   and the presigned PUT URL this method returns is cryptographically
 *   bound (AWS SigV4) to that *exact* key. Unlike Cloudinary's folder-level
 *   signing (which still lets the uploading SDK pick its own `public_id`
 *   inside the signed folder), there is no key the client could substitute
 *   to write into a different product's namespace or overwrite another
 *   object — this fully closes requirement 7/8's cross-product-claiming
 *   concern once wired into `AdminService` (which must still re-run
 *   `isValidS3ObjectKey` against the resolved `productId` before trusting
 *   a reported key at verify/save time, exactly as it does today for
 *   Cloudinary — this class only mints the key, it does not and cannot
 *   enforce who later *claims* it belongs to a given product).
 * - Content-Type is deliberately NOT part of what the presigned URL signs
 *   and NOT trusted at verification time. A presigned PUT cannot enforce
 *   object size (unlike Cloudinary's `allowed_formats`/size check at sign
 *   time), so this class treats nothing about the upload as trusted until
 *   `verifyMedia` re-derives it from the bytes actually stored: real
 *   format (magic-byte signature, not extension or header), real
 *   dimensions (decoded from the image header, images only — see the video
 *   limitation below), and real size (`HeadObject.ContentLength`, checked
 *   against `mediaLimits()` before any body is ever read). A forged
 *   `Content-Type` on the PUT, or a client lying about the file's
 *   extension, changes nothing this method checks.
 * - Reads are always bounded: `verifyMedia` never pulls more bytes into
 *   memory than `mediaLimits()` allows for that kind, and video probing
 *   reads only small head/tail slices via S3 `Range` requests — never the
 *   whole (up to 50MB+) object. `getObjectRange` additionally enforces
 *   this even if the storage backend ignores the `Range` header or a
 *   response claims more bytes than requested (see that method) — the
 *   bound is not simply "trust the Range request was honored".
 *
 * What this class does NOT, and currently CANNOT, enforce — do not assume
 * SeaweedFS matches AWS S3 feature-for-feature; none of the below has
 * been verified against a live SeaweedFS deployment (no infra access in
 * this session):
 * - **Upload size cannot be bounded before the bytes land in the bucket.**
 *   A presigned PUT (unlike a presigned POST with a
 *   `content-length-range` policy condition) carries no server-enforced
 *   size limit — the client could PUT an arbitrarily large body. Enforcement
 *   here is entirely post-hoc: `HeadObject.ContentLength` is checked
 *   against `mediaLimits()` before any body bytes are read, and an
 *   oversized object is deleted immediately. On a 2GB-RAM, limited-disk
 *   VPS, this means a single misbehaving/malicious upload can transiently
 *   consume disk up to whatever the client actually sent before cleanup
 *   runs — there is no way to reject the bytes *during* the PUT with this
 *   mechanism alone. A presigned POST with `content-length-range` would
 *   close this gap at the storage layer instead of after the fact, but
 *   whether SeaweedFS's S3 gateway implements S3 POST policy documents
 *   (as opposed to just presigned-URL query auth) needs to be verified
 *   against the actual deployed version before relying on it — not done
 *   here. Until verified, treat the post-hoc `HeadObject` check as the
 *   only real enforcement, and make sure production `nginx` in front of
 *   whatever path reaches the S3 endpoint sets `client_max_body_size` to
 *   at least `PRODUCT_VIDEO_MAX_MB` (+ margin) so an oversized request is
 *   rejected at the proxy rather than filling disk — a production/infra
 *   configuration item, not something this class can set.
 * - **No conditional-write (overwrite) protection is applied at the S3
 *   layer.** A `PutObjectCommand` with `IfNoneMatch: "*"` would make a PUT
 *   fail if the key already exists (S3's newer conditional-write
 *   extension), but support for that header is not universal across
 *   S3-compatible backends and is NOT assumed here — adding it unverified
 *   risks breaking every upload if SeaweedFS rejects the unrecognized
 *   header instead of ignoring it. Overwrite risk is instead made
 *   practically negligible by construction: every key is a fresh
 *   192-bit-random token (`mintS3ObjectKey`), so two uploads colliding on
 *   the same key is not a realistic threat, only a theoretical one this
 *   class does not additionally guard against at the protocol level.
 * - **No automatic cleanup of abandoned (never-verified) uploads.** A
 *   presigned URL that's handed out but never used (or used but never
 *   followed by a `verifyMedia`/save step) leaves an orphaned object in
 *   `rad/pending/` indefinitely — the storage-layer presigned TTL
 *   (`S3_UPLOAD_URL_TTL_SECONDS`, clamped to
 *   `[MIN_UPLOAD_URL_TTL_SECONDS, MAX_UPLOAD_URL_TTL_SECONDS]`) only
 *   limits how long the URL is usable, not how long an already-uploaded
 *   object survives. See `s3-lifecycle.ts` for the (currently
 *   unexecuted — no scheduled job wired up, no infra access) decision
 *   logic a future sweep would use, and the recommendation to also check
 *   whether SeaweedFS supports S3 bucket lifecycle rules as a
 *   storage-side alternative.
 */
@Injectable()
export class S3StorageService implements MediaStorage {
  private readonly logger = new Logger(S3StorageService.name);
  private internalClient?: S3Client;
  private publicClient?: S3Client;
  private bucket?: string;
  private uploadTtlSeconds = 900;

  constructor(private readonly config: ConfigService) {}

  /**
   * Eagerly validates required S3 config, throwing synchronously if
   * incomplete. Called by `StorageModule`'s provider factory ONLY when
   * `MEDIA_STORAGE_PROVIDER=s3` is explicitly selected, so NestJS
   * bootstrap fails fast with a clear error at startup — never silently
   * falls back to Cloudinary, and never waits until the first real admin
   * upload attempt to discover S3 was never configured. Reuses
   * `ensureConfigured`'s own checks rather than duplicating them.
   */
  validateStartupConfig() {
    this.ensureConfigured();
  }

  private requireEnv(name: string) {
    const value = this.config.get<string>(name);
    if (!value) {
      this.logger.error(
        `Media storage configuration missing: ${name} is not set on the API runtime.`,
      );
      throw new ServiceUnavailableException({
        code: "media_storage_unavailable",
        message: "فضای بارگذاری آماده نیست. با پشتیبانی تماس بگیرید و دوباره تلاش کنید.",
      });
    }
    return value;
  }

  private ensureConfigured() {
    if (this.internalClient && this.publicClient && this.bucket) return;
    const region = this.requireEnv("S3_REGION");
    const accessKeyId = this.requireEnv("S3_ACCESS_KEY_ID");
    const secretAccessKey = this.requireEnv("S3_SECRET_ACCESS_KEY");
    const internalEndpoint = this.requireEnv("S3_ENDPOINT");
    const publicEndpoint = this.requireEnv("S3_PUBLIC_ENDPOINT");
    const bucket = this.requireEnv("S3_MEDIA_BUCKET");
    const forcePathStyle = this.config.get<string>("S3_FORCE_PATH_STYLE") !== "false";
    const requestedTtl = Number(this.config.get<string>("S3_UPLOAD_URL_TTL_SECONDS") ?? 900);
    if (Number.isFinite(requestedTtl)) {
      // Clamp rather than trust a misconfigured env value outright — too
      // short (near 0) breaks real uploads, too long turns a signed URL
      // into a near-permanent, unrevocable credential.
      this.uploadTtlSeconds = Math.min(
        MAX_UPLOAD_URL_TTL_SECONDS,
        Math.max(MIN_UPLOAD_URL_TTL_SECONDS, requestedTtl),
      );
    }

    const credentials = { accessKeyId, secretAccessKey };
    // Two clients, same credentials/bucket: `internalClient` is what the
    // API itself uses for HeadObject/GetObject/DeleteObject (reaching
    // SeaweedFS over whatever path is fastest/available to the API
    // process — a Docker-network hostname, 127.0.0.1, etc). `publicClient`
    // exists *only* to mint presigned URLs, so the signed host the
    // browser actually calls is the public HTTPS media domain, never an
    // internal hostname the browser can't resolve — see the architecture
    // report's Phase Four note on this exact failure mode.
    this.internalClient = new S3Client({
      region,
      endpoint: internalEndpoint,
      forcePathStyle,
      credentials,
    });
    this.publicClient = new S3Client({
      region,
      endpoint: publicEndpoint,
      forcePathStyle,
      credentials,
    });
    this.bucket = bucket;
  }

  /**
   * Returns a presigned PUT URL for a brand-new, server-minted object key
   * under `folder` (produced the same way as Cloudinary's — see
   * `productImageFolder` — so the logical namespace stays identical across
   * providers, only the backing store differs).
   *
   * Does NOT, and cannot, enforce a maximum upload size at the protocol
   * level — see the class-level doc comment's "What this class does NOT
   * enforce" section. `limits` is returned so a caller can still show/
   * enforce a client-side expectation, but the only real enforcement is
   * `verifyMedia`'s post-hoc `HeadObject` check.
   */
  async createSignedUpload(
    folder: string,
    kind: "image" | "video" = "image",
  ): Promise<S3SignedUpload> {
    this.ensureConfigured();
    const objectKey = mintS3ObjectKey(folder);
    const uploadUrl = await getSignedUrl(
      this.publicClient!,
      new PutObjectCommand({ Bucket: this.bucket!, Key: objectKey }),
      { expiresIn: this.uploadTtlSeconds },
    );
    return {
      provider: "s3",
      uploadUrl,
      method: "PUT",
      objectKey,
      resourceType: kind,
      limits: mediaLimits(),
      expiresAt: Date.now() + this.uploadTtlSeconds * 1000,
    };
  }

  private async headObject(objectKey: string) {
    try {
      return await this.internalClient!.send(
        new HeadObjectCommand({ Bucket: this.bucket!, Key: objectKey }),
      );
    } catch (error) {
      if (error instanceof NotFound || (error as { name?: string }).name === "NotFound") {
        throw new BadRequestException("فایل پیدا نشد. دوباره بارگذاری کنید.");
      }
      throw new ServiceUnavailableException("بررسی فایل ممکن نشد. دوباره تلاش کنید.");
    }
  }

  /**
   * Reads an inclusive byte range `[start, end]` of the object.
   *
   * Does NOT simply trust that the storage backend honored the `Range`
   * header — a backend that ignores `Range` and returns the full object
   * (or any response larger than requested, buggy or adversarial) would
   * otherwise defeat the entire point of range-probing: bounding memory
   * use on a 2GB-RAM VPS when checking a file that could be up to
   * `PRODUCT_VIDEO_MAX_MB`. The read is capped at the requested byte
   * budget and aborted — not silently truncated — the instant more bytes
   * arrive than asked for, since that means this object's size can no
   * longer be trusted for anything else in the caller either.
   */
  private async getObjectRange(objectKey: string, start: number, end: number) {
    const budget = end - start + 1;
    try {
      const result = await this.internalClient!.send(
        new GetObjectCommand({
          Bucket: this.bucket!,
          Key: objectKey,
          Range: `bytes=${start}-${end}`,
        }),
      );
      const body = result.Body;
      if (!body) throw new Error("empty body");
      const chunks: Buffer[] = [];
      let total = 0;
      for await (const chunk of body as AsyncIterable<Uint8Array>) {
        total += chunk.length;
        if (total > budget) {
          (body as { destroy?: () => void }).destroy?.();
          throw new Error(
            `range response for ${objectKey} exceeded the requested ${budget}-byte budget`,
          );
        }
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    } catch (error) {
      this.logger.warn(`getObjectRange failed for ${objectKey}: ${(error as Error).message}`);
      throw new ServiceUnavailableException("بررسی فایل ممکن نشد. دوباره تلاش کنید.");
    }
  }

  /** Best-effort delete of a definitively-invalid upload so rejected bytes don't linger. Never throws. */
  private async cleanupRejected(objectKey: string) {
    try {
      await this.internalClient!.send(
        new DeleteObjectCommand({ Bucket: this.bucket!, Key: objectKey }),
      );
    } catch (error) {
      this.logger.warn(
        `Failed to clean up rejected upload ${objectKey}: ${(error as Error).message}`,
      );
    }
  }

  async verifyMedia(
    objectKey: string,
    kind: "image" | "video",
  ): Promise<{ objectKey: string; storage: ProductImageStorage }> {
    this.ensureConfigured();
    const head = await this.headObject(objectKey);
    const size = head.ContentLength;
    if (typeof size !== "number") {
      throw new ServiceUnavailableException("بررسی فایل ممکن نشد. دوباره تلاش کنید.");
    }
    try {
      validateMediaSize(size, kind);
    } catch (error) {
      await this.cleanupRejected(objectKey);
      throw error;
    }

    if (kind === "image") {
      // Images are capped at `mediaLimits().image` (2MB); reading the
      // whole object (already size-checked above) is simpler and still
      // small/bounded — no need for a partial range read.
      const bytes = await this.getObjectRange(objectKey, 0, size - 1);
      const signature = sniffImage(bytes);
      const dimensionsValid =
        !!signature &&
        signature.width > 0 &&
        signature.height > 0 &&
        signature.width <= MAX_IMAGE_DIMENSION_PX &&
        signature.height <= MAX_IMAGE_DIMENSION_PX;
      if (!dimensionsValid) {
        await this.cleanupRejected(objectKey);
        throw new BadRequestException(
          "محتوای فایل معتبر نیست. تصویر JPEG، PNG یا WebP انتخاب کنید.",
        );
      }
      // Identifying the real format/dimensions from header bytes is NOT
      // the same guarantee Cloudinary's Admin API gave us (a full decode)
      // — see `media-signature.ts`'s module comment for exactly what this
      // check does and does not prove.
      return { objectKey, storage: "s3" };
    }

    const head0 = await this.getObjectRange(
      objectKey,
      0,
      Math.min(size, VIDEO_PROBE_CHUNK_BYTES) - 1,
    );
    let valid = looksLikeWebm(head0);
    if (!valid) {
      if (size > VIDEO_PROBE_CHUNK_BYTES) {
        const tail = await this.getObjectRange(
          objectKey,
          Math.max(0, size - VIDEO_PROBE_CHUNK_BYTES),
          size - 1,
        );
        valid = looksLikeMp4(head0, tail);
      } else {
        valid = looksLikeMp4(head0);
      }
    }
    if (!valid) {
      await this.cleanupRejected(objectKey);
      throw new BadRequestException(
        "محتوای فایل معتبر نیست. ویدیوی MP4 یا WebM انتخاب کنید.",
      );
    }
    // Structural container validation only — see `looksLikeMp4`/
    // `looksLikeWebm`'s doc comments for exactly what is and isn't
    // checked (no codec/decode/dimension verification for video).
    return { objectKey, storage: "s3_video" };
  }

  async destroy(objectKey: string) {
    this.ensureConfigured();
    try {
      await this.internalClient!.send(
        new DeleteObjectCommand({ Bucket: this.bucket!, Key: objectKey }),
      );
    } catch (error) {
      throw new Error(`S3 destroy failed for ${objectKey}: ${(error as Error).message}`);
    }
  }
}
