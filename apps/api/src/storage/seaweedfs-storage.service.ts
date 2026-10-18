import {
  Injectable,
  ServiceUnavailableException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "node:crypto";
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  NotFound,
  S3Client,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { mediaLimits, validateMediaSize } from "./media-policy";
import type { MediaStorageService } from "./media-storage.interface";

const UPLOAD_EXPIRES_SECONDS = 5 * 60;

/**
 * S3-compatible adapter for a self-hosted SeaweedFS cluster (SeaweedFS's S3
 * gateway speaks the same API this client targets). Selected instead of
 * `CloudinaryStorageService` only when `MEDIA_STORAGE_PROVIDER=seaweedfs`
 * (see `storage.module.ts`) — Cloudinary stays the default.
 *
 * All secrets/config come from env vars only, mirroring
 * `CloudinaryStorageService`:
 *  - `SEAWEEDFS_ENDPOINT` — base URL of the S3 gateway (e.g. http://seaweedfs:8333)
 *  - `SEAWEEDFS_BUCKET` — bucket product media is stored under
 *  - `SEAWEEDFS_ACCESS_KEY` / `SEAWEEDFS_SECRET_KEY` — S3 credentials
 *  - `SEAWEEDFS_REGION` — optional, defaults to "us-east-1" (SeaweedFS
 *    ignores region but the SDK requires one)
 *  - `SEAWEEDFS_PUBLIC_URL` — optional base URL product.mapper.ts builds
 *    delivery URLs from (e.g. a CDN/reverse proxy in front of the gateway);
 *    falls back to `${SEAWEEDFS_ENDPOINT}/${SEAWEEDFS_BUCKET}` when unset.
 *  - `SEAWEEDFS_PUBLIC_UPLOAD_URL` — optional base URL the *browser* POSTs
 *    signed uploads to, when it differs from `SEAWEEDFS_ENDPOINT`.
 *    `SEAWEEDFS_ENDPOINT` is what the API server itself talks to (e.g.
 *    `http://127.0.0.1:8333` on the same VPS as the gateway) and is what
 *    every signature is computed against — SigV4 POST-policy signatures
 *    only cover the policy document (bucket/key/size/content-type
 *    conditions), not the request host or path prefix, so the `url` field
 *    returned to the browser can safely point somewhere else without
 *    invalidating the signature. Set this to the public HTTPS origin in
 *    front of the gateway whenever the gateway itself is bound to a
 *    loopback/internal address the browser can't reach directly — this
 *    can be a dedicated host (`https://media.example.com`) or a path
 *    prefix on an existing one reused via a reverse proxy (e.g.
 *    `https://api.example.com/storage`, reverse-proxied to the gateway
 *    with that prefix stripped); both forms just get the signed URL's own
 *    `/<bucket>` path appended. Falls back to `SEAWEEDFS_ENDPOINT` when
 *    unset (same-host deployments only).
 *
 * Operational requirement this adapter cannot configure itself: the
 * reverse proxy (or bucket, if it terminates TLS itself) in front of the
 * gateway must allow `POST` (and the `Content-Type`/form-field headers it
 * sends, plus the `OPTIONS` preflight) from the admin app's origin, or the
 * browser's direct upload in `createSignedUpload`'s flow will be blocked
 * by CORS before it ever reaches SeaweedFS — Cloudinary's own upload
 * endpoint already allows this for every origin, so this had no
 * equivalent under the previous provider.
 *
 * Unlike Cloudinary, the S3 protocol has no asset-inspection API: `destroy`
 * and existence checks are plain object operations, and `verifyMedia`
 * cannot decode the uploaded bytes to confirm they are genuinely a valid
 * image/video the way `CloudinaryStorageService.verifyMedia` does (it
 * only checks the object exists, its size is within `mediaLimits()`, and
 * — when the uploader set it — its `Content-Type` matches the expected
 * kind). Callers relying on stronger content validation than that should
 * be aware of this gap before switching providers in a security-sensitive
 * flow.
 */
@Injectable()
export class SeaweedfsStorageService implements MediaStorageService {
  private client: S3Client | undefined;
  private bucket = "";

  constructor(private readonly config: ConfigService) {}

  private ensureConfigured(): S3Client {
    if (this.client) return this.client;
    const endpoint = this.config.get<string>("SEAWEEDFS_ENDPOINT");
    const bucket = this.config.get<string>("SEAWEEDFS_BUCKET");
    const accessKeyId = this.config.get<string>("SEAWEEDFS_ACCESS_KEY");
    const secretAccessKey = this.config.get<string>("SEAWEEDFS_SECRET_KEY");
    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      new Logger(SeaweedfsStorageService.name).error(
        "Media storage configuration missing: set SEAWEEDFS_ENDPOINT, SEAWEEDFS_BUCKET, SEAWEEDFS_ACCESS_KEY and SEAWEEDFS_SECRET_KEY on the API runtime.",
      );
      throw new ServiceUnavailableException({
        code: "media_storage_unavailable",
        message:
          "فضای بارگذاری آماده نیست. با پشتیبانی تماس بگیرید و دوباره تلاش کنید.",
      });
    }
    this.bucket = bucket;
    this.client = new S3Client({
      endpoint,
      region: this.config.get<string>("SEAWEEDFS_REGION") || "us-east-1",
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });
    return this.client;
  }

  /**
   * Presigned S3 POST policy scoped to `folder`, mirroring the shape of
   * `CloudinaryStorageService.createSignedUpload`'s contract (callers get
   * back everything needed for a direct browser → storage upload). The
   * object key is minted here — not by the browser — since the S3 POST
   * policy must name an exact key (or prefix) up front.
   *
   * S3's POST policy rejects any form field the browser sends that isn't
   * covered by a `Conditions` entry — so the `Content-Type` condition
   * below is unconditional (not gated on `restricted`, unlike Cloudinary's
   * `allowed_formats`): the admin client always needs to be able to send
   * the file's real `Content-Type` field for SeaweedFS to store it, and
   * `verifyMedia` below depends on that stored value for its own check.
   * `restricted` has no effect here; it's kept only so the interface
   * matches `CloudinaryStorageService`.
   */
  async createSignedUpload(folder: string, kind: "image" | "video" = "image") {
    const client = this.ensureConfigured();
    const objectKey = `${folder}/${randomBytes(16).toString("hex")}`;
    const limits = mediaLimits();
    const { url, fields } = await createPresignedPost(client, {
      Bucket: this.bucket,
      Key: objectKey,
      Expires: UPLOAD_EXPIRES_SECONDS,
      Conditions: [
        ["content-length-range", 1, limits[kind]],
        ["starts-with", "$Content-Type", `${kind}/`],
      ],
    });
    return {
      provider: "seaweedfs" as const,
      url: this.publicUploadUrl(url),
      fields,
      objectKey,
      resourceType: kind,
      limits,
    };
  }

  /**
   * Rewrites the signed POST's host from the internal endpoint the API
   * server signed against to the public-facing one the browser can
   * actually reach, when `SEAWEEDFS_PUBLIC_UPLOAD_URL` is set. Safe
   * because the signature only covers the policy document, not the
   * request host — see the class doc comment.
   */
  private publicUploadUrl(signedUrl: string): string {
    const publicBase = (
      this.config.get<string>("SEAWEEDFS_PUBLIC_UPLOAD_URL") ?? ""
    ).trim();
    if (!publicBase) return signedUrl;
    const path = new URL(signedUrl).pathname;
    return `${publicBase.replace(/\/$/, "")}${path}`;
  }

  /**
   * Confirms the object exists and is within size limits — see the class
   * doc comment for why this can't also decode/verify the bytes the way
   * Cloudinary's equivalent does.
   */
  async verifyMedia(objectKey: string, kind: "image" | "video") {
    const client = this.ensureConfigured();
    let head;
    try {
      head = await client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      );
    } catch (error) {
      if (error instanceof NotFound) {
        throw new BadRequestException("فایل پیدا نشد. دوباره بارگذاری کنید.");
      }
      throw new ServiceUnavailableException(
        "بررسی فایل ممکن نشد. دوباره تلاش کنید.",
      );
    }
    if (head.ContentType && !head.ContentType.startsWith(`${kind}/`)) {
      throw new BadRequestException(
        "محتوای فایل معتبر نیست. تصویر JPEG، PNG، WebP یا ویدیوی MP4، WebM انتخاب کنید.",
      );
    }
    validateMediaSize(head.ContentLength ?? 0, kind);
    return {
      objectKey,
      storage:
        kind === "video"
          ? ("seaweedfs_video" as const)
          : ("seaweedfs" as const),
    };
  }

  /** Delete is naturally idempotent on S3 — a missing key is not an error. */
  async destroy(objectKey: string) {
    const client = this.ensureConfigured();
    await client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }),
    );
  }
}
