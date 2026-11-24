import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

export const PRODUCT_IMAGE_STORAGES = [
  "legacy_base64",
  "static",
  "external",
  "seaweedfs",
  "seaweedfs_video",
] as const;

export type ProductImageInputStorage = (typeof PRODUCT_IMAGE_STORAGES)[number];

/**
 * Discriminated input for one product image on save:
 *  - legacy_base64 / static / external → `src` carries the (existing) value.
 *  - seaweedfs/seaweedfs_video → `objectKey` carries the signed S3 object key;
 *    uploaded bytes are never persisted in the database.
 *
 * class-validator doesn't have a clean way to express a discriminated union
 * on one class, so this DTO validates the common shape only; the real
 * per-branch checks (which field is required/forbidden, and — for
 * `seaweedfs` — that `objectKey` matches a key this API signed for) run in
 * `AdminService.replaceImages`, matching this codebase's existing style of doing the real business validation at the
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
    description: "Required for remote media: the S3 object key",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  objectKey?: string;
}

export type AdminProductImageInput =
  | { storage: "legacy_base64"; src: string }
  | { storage: "static" | "external"; src: string }
  | {
      storage: "seaweedfs" | "seaweedfs_video";
      objectKey: string;
    };
