import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";

/** Mime types new admin uploads may use — mirrors `assertImageData`'s allowlist. */
export const ALLOWED_PRODUCT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedProductImageMimeType =
  (typeof ALLOWED_PRODUCT_IMAGE_MIME_TYPES)[number];

export function isAllowedProductImageMime(
  value: string,
): value is AllowedProductImageMimeType {
  return (ALLOWED_PRODUCT_IMAGE_MIME_TYPES as readonly string[]).includes(value);
}

/**
 * Cloudinary folder a new upload's signed params target.
 *
 * Namespaced by the product's immutable `id`, never by `slug` (slug is
 * editable-looking at the DTO layer even though `AdminService.updateProduct`
 * currently rejects any change to it after creation — namespacing by `id`
 * means this still holds even if that restriction is ever relaxed).
 *
 * `productId` is `null` for uploads that happen before a product exists
 * yet (the admin "create" dialog lets an admin attach images before the
 * first save) — those go to the unassociated `rad/pending` folder instead.
 *
 * Unlike the R2 design this replaces, a `rad/pending/...` upload that ends
 * up referenced by a saved product is simply left where it is — see the
 * module-level comment below for why no rename/migration step is needed.
 */
export function productImageFolder(productId: string | null) {
  return productId ? `rad/products/${productId}` : "rad/pending";
}

/** Matches exactly what a signed upload under `productImageFolder(productId, ...)` produces. */
export function productImagePublicIdPattern(productId: string) {
  return new RegExp(`^rad/products/${productId}/[A-Za-z0-9_-]+$`);
}

/**
 * Matches a not-yet-associated upload: signed by our own endpoint before
 * the product it belongs to existed, so it carries no id to check against.
 * Accepted at save time for any product — safe because only an
 * authenticated admin with `product.write` can ever request a signature
 * for, or submit, one.
 */
export const PENDING_PRODUCT_IMAGE_PUBLIC_ID_PATTERN = /^rad\/pending\/[A-Za-z0-9_-]+$/;

export function isValidProductImagePublicId(productId: string, publicId: string) {
  return (
    productImagePublicIdPattern(productId).test(publicId) ||
    PENDING_PRODUCT_IMAGE_PUBLIC_ID_PATTERN.test(publicId)
  );
}

/**
 * Lifecycle decision for `rad/pending/...` uploads (replaces the R2 design's
 * `pending/` prefix + bucket lifecycle rule + copy-then-repoint-then-delete
 * dance at save time):
 *
 * Cloudinary's upload API lets the browser mint its own `public_id` within
 * a signed folder with no pre-known id required, so there is no structural
 * need to ever move/rename an asset after upload the way the R2 key scheme
 * did. A `rad/pending/<id>` asset that gets attached to a saved product
 * simply stays at that `public_id` forever — `replaceImages` persists it
 * as-is, no migration step, so there is no window where a referenced image
 * could be mistaken for an abandoned one (the bug the R2 work had to fix).
 *
 * The trade-off: an upload that is *never* attached to a saved product
 * (the admin closes the create dialog without saving) has no DB row to
 * ever trigger a cleanup diff against, so it is never deleted by
 * application code. RAD is low-volume and admin-only, so rather than
 * re-introducing a time-based expiry rule (and the lifecycle-race risk
 * that comes with it) or a new `PendingUpload` tracking table, this is
 * accepted as a known, low-priority gap for Phase 2: abandoned
 * `rad/pending/` assets accumulate in Cloudinary without automatic
 * cleanup. They can be swept periodically with Cloudinary's own
 * "unused assets" / Media Library tools (outside this codebase) if it
 * ever becomes worth doing. No referenced image is ever at risk.
 */
export const PENDING_UPLOAD_CLEANUP_POLICY =
  "no-automatic-expiry — see module comment";

@Injectable()
export class CloudinaryStorageService {
  private configured = false;

  constructor(private readonly config: ConfigService) {}

  private ensureConfigured() {
    if (this.configured) return;
    const cloudName = this.config.get<string>("CLOUDINARY_CLOUD_NAME");
    const apiKey = this.config.get<string>("CLOUDINARY_API_KEY");
    const apiSecret = this.config.get<string>("CLOUDINARY_API_SECRET");
    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        "بارگذاری تصویر پیکربندی نشده است. متغیرهای CLOUDINARY را در apps/api/.env تنظیم کنید.",
      );
    }
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    this.configured = true;
  }

  /**
   * Signed params for a direct browser → Cloudinary upload, scoped to
   * `folder`. Only `folder` and `timestamp` are signed; the browser also
   * sends the (public) `apiKey`/`cloudName` returned here alongside the
   * file — `CLOUDINARY_API_SECRET` itself never leaves this method.
   *
   * Signing goes through Cloudinary's own `utils.api_sign_request`, which
   * implements their documented algorithm (sort params to sign
   * alphabetically, join as `key=value` pairs with `&`, append the API
   * secret, SHA-1 hex digest) — see `cloudinary-storage.spec.ts`, which
   * independently recomputes the same digest by hand and asserts it
   * matches, so this isn't just testing the SDK against itself.
   */
  createSignedUpload(folder: string) {
    this.ensureConfigured();
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = { folder, timestamp };
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      this.config.get<string>("CLOUDINARY_API_SECRET") as string,
    );
    return {
      cloudName: this.config.get<string>("CLOUDINARY_CLOUD_NAME") as string,
      apiKey: this.config.get<string>("CLOUDINARY_API_KEY") as string,
      timestamp,
      folder,
      signature,
    };
  }

  /**
   * Best-effort delete of an orphaned Cloudinary asset after a DB
   * transaction has already committed its removal from `ProductImage`.
   * Failures are logged by the caller and never roll back the save — see
   * `admin.service.ts`. `not found` is treated as success (idempotent
   * re-save / already-deleted asset).
   */
  async destroy(publicId: string) {
    this.ensureConfigured();
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });
    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error(`Cloudinary destroy returned result=${result.result}`);
    }
  }
}
