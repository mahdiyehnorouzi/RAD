import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { PRODUCT_STATUSES } from "../../inventory/const/product-status";
import type { ProductStatus } from "../../inventory/type";
import { AdminProductImageInputDto } from "./product-image-input.dto";

const ADMIN_CATEGORIES = [
  "گلدان",
  "ظروف",
  "مجسمه",
  "سفال و سرامیک",
  "نقاشی",
  "پارچه و بافت",
  "آثار چوبی",
  "زیورآلات هنری",
  "چاپ دستی و تصویر",
];

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
}
