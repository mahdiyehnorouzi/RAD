import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { PRODUCT_STATUSES } from "../../inventory/const/product-status";
import type { ProductStatus } from "../../inventory/type";
import { ADMIN_CATEGORIES } from "../../catalog/category";
import { AdminProductImageInputDto } from "./product-image-input.dto";
import type { ProductAttributeValue } from "@rad/types";

export class SaveProductDto {
  @ApiPropertyOptional({ example: "clx123abc456" })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: "moon-vase" })
  @IsString()
  @MinLength(1)
  slug!: string;

  @ApiProperty({ example: "گلدان ماه" })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: "سفال دست‌ساز با لعاب مات و فرم بلند." })
  @IsString()
  @MinLength(1)
  description!: string;

  @ApiPropertyOptional({
    example: "سفال دست‌ساز با لعاب مات.",
    description:
      "Short lede shown under the title on the PDP. Falls back to the " +
      "first 48 characters of `description` when left blank.",
  })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiProperty({ example: "گلدان", enum: ADMIN_CATEGORIES })
  @IsIn(ADMIN_CATEGORIES)
  category!: string;

  @ApiProperty({ example: 8500000 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  price!: number;

  @ApiProperty({
    example: "available",
    enum: PRODUCT_STATUSES,
    description:
      "draft → in_workshop → ready → available → sold → archived. Cart holds are managed by the API.",
  })
  @IsIn(PRODUCT_STATUSES)
  status!: ProductStatus;

  @ApiProperty({ example: "استودیو رَد" })
  @IsString()
  @MinLength(1)
  artist!: string;

  @ApiProperty({
    example: [],
    description:
      "Product images: legacy_base64/static/external carry `src`, cloudinary carries " +
      "the `objectKey` (Cloudinary public_id) the signed upload from " +
      "POST /admin/products/:slug/images/sign wrote to.",
    type: [AdminProductImageInputDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminProductImageInputDto)
  images!: AdminProductImageInputDto[];

  @ApiPropertyOptional({
    description:
      "Attribute values keyed by attribute id. Structurally validated here " +
      "only; required/type/option checks run against the live attribute " +
      "definitions in ProductAttributesService.",
    example: { clx_attr_color: "سفید" },
  })
  @IsOptional()
  @IsObject()
  attributeValues?: Record<string, ProductAttributeValue>;
}
