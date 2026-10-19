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
import { mediaLimits, validateMediaSize } from "./media-policy";
import { mintS3ObjectKey } from "./s3-object-key";
import { looksLikeMp4, looksLikeWebm, sniffImage } from "./media-signature";
import type { MediaStorage } from "./media-storage.interface";
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
 * providers (`ProductImageStorage` gaining `"s3"`/`"s3_video"`, wiring
 * `isValidS3ObjectKey` into `AdminService`, and a `MediaStorage.
 * createSignedUpload` signature change — see the note on that method
 * below).
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
 *   whole (up to 50MB+) object.
 */
@Injectable()
export class S3StorageService implements Pick<MediaStorage, "verifyMedia" | "destroy"> {
  private readonly logger = new Logger(S3StorageService.name);
  private internalClient?: S3Client;
  private publicClient?: S3Client;
  private bucket?: string;
  private uploadTtlSeconds = 900;

  constructor(private readonly config: ConfigService) {}

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
    const ttl = Number(this.config.get<string>("S3_UPLOAD_URL_TTL_SECONDS") ?? 900);
    if (Number.isFinite(ttl) && ttl > 0) this.uploadTtlSeconds = ttl;

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
   * NOT declared as implementing `MediaStorage.createSignedUpload`: that
   * method is synchronous (matching `CloudinaryStorageService`, whose
   * HMAC signing needs no I/O), but minting a presigned S3 URL via
   * `getSignedUrl` is inherently a `Promise`-returning call. The smallest
   * safe fix, deferred to the PR that actually wires this provider in, is
   * widening `MediaStorage.createSignedUpload`'s return type from
   * `Record<string, unknown>` to `Promise<Record<string, unknown>>` —
   * zero behavior change for `CloudinaryStorageService`, since a
   * non-Promise value returned from an `async` method already resolves to
   * that value, and Nest controllers already return the result of this
   * call directly (already `await`-compatible either way). Not applied in
   * this PR to keep PR1's interface untouched, per scope.
   */
  async createSignedUpload(folder: string, kind: "image" | "video" = "image") {
    this.ensureConfigured();
    const objectKey = mintS3ObjectKey(folder);
    const uploadUrl = await getSignedUrl(
      this.publicClient!,
      new PutObjectCommand({ Bucket: this.bucket!, Key: objectKey }),
      { expiresIn: this.uploadTtlSeconds },
    );
    return {
      provider: "s3" as const,
      uploadUrl,
      method: "PUT" as const,
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

  /** Reads an inclusive byte range `[start, end]` of the object, bounded by the caller. */
  private async getObjectRange(objectKey: string, start: number, end: number) {
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
      for await (const chunk of body as AsyncIterable<Uint8Array>) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    } catch {
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
      if (!signature || !(signature.width > 0 && signature.height > 0)) {
        await this.cleanupRejected(objectKey);
        throw new BadRequestException(
          "محتوای فایل معتبر نیست. تصویر JPEG، PNG یا WebP انتخاب کنید.",
        );
      }
      return { objectKey, storage: "s3" as ProductImageStorage };
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
    // `"s3" as ProductImageStorage`: `ProductImageStorage` does not yet
    // include an S3 variant (that union is extended in the PR that wires
    // this provider in, alongside the DB-persisted rows that would use it
    // — not needed to type-check this standalone class, and nothing in
    // this PR persists this value). The type-asserted literal below
    // documents the intended value precisely so it isn't lost before then.
    return { objectKey, storage: "s3_video" as ProductImageStorage };
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
