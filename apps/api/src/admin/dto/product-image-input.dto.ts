import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

/**
 * Deliberately does NOT include `"s3"`/`"s3_video"` yet, even though
 * `ProductImageStorage` (the DB-level read union, `product-image.entity.ts`)
 * already does. This `@IsIn` check is the admin API's INPUT allowlist — the
 * outermost gate a save request passes through — and it is what currently
 * makes `storage: "s3"` fully unreachable end-to-end, before
 * `AdminService.saveProduct` is ever called.
 *
 * Adding `"s3"`/`"s3_video"` here on its own, without also adding a
 * matching explicit branch in `AdminService.saveProduct`'s per-image
 * validation loop (one that calls `isValidS3ObjectKey` + a real
 * `MediaStorage.verifyMedia`, exactly like the existing `cloudinary`
 * branch does), would be unsafe: `saveProduct`'s current fallback for any
 * storage value it doesn't explicitly recognize is
 * `else if (!image.src) throw ...` — i.e. it would silently TRUST a
 * client-supplied `src` for an "s3" row with no existence/ownership check
 * at all, the exact "broad fallback that silently accepts unknown storage
 * types" this codebase's review rules warn against. So both changes must
 * land together in the PR that actually wires S3 uploads in — not here.
 */
export const PRODUCT_IMAGE_STORAGES = [
  "legacy_base64",
  "static",
  "external",
  "cloudinary",
  "cloudinary_video",
] as const;

export type ProductImageInputStorage = (typeof PRODUCT_IMAGE_STORAGES)[number];

/**
 * Discriminated input for one product image on save:
 *  - legacy_base64 / static / external → `src` carries the (existing) value.
 *  - cloudinary → `objectKey` carries the Cloudinary `public_id` the signed
 *    upload wrote to; `src` must be absent — bytes are never persisted for
 *    cloudinary rows, and the delivery URL is derived from the public_id +
 *    Cloudinary config at read time, never stored as the source of truth
 *    (see `product.mapper.ts#imageSrc`).
 *
 * class-validator doesn't have a clean way to express a discriminated union
 * on one class, so this DTO validates the common shape only; the real
 * per-branch checks (which field is required/forbidden, and — for
 * `cloudinary` — that `objectKey` matches a public_id this API could have
 * actually signed for) run in `AdminService.replaceImages`, matching this
 * codebase's existing style of doing the real business validation at the
 * service layer (see `normalizeTrackingNumber` / `assertImageData`).
 */
export class AdminProductImageInputDto {
  @ApiProperty({ enum: PRODUCT_IMAGE_STORAGES })
  @IsIn(PRODUCT_IMAGE_STORAGES)
  storage!: ProductImageInputStorage;

  @ApiProperty({
    required: false,
    description: "Required for legacy_base64/static/external",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  src?: string;

  @ApiProperty({
    required: false,
    description:
      "Required for storage: cloudinary — the asset's Cloudinary public_id",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  objectKey?: string;
}

export type AdminProductImageInput =
  | { storage: "legacy_base64"; src: string }
  | { storage: "static" | "external"; src: string }
  | { storage: "cloudinary" | "cloudinary_video"; objectKey: string };
