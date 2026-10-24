import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { STORE_CATEGORIES } from "../../catalog/category";
import { MAX_ATTRIBUTE_OPTIONS, PRODUCT_ATTRIBUTE_INPUT_TYPES } from "../const";
import type { ProductAttributeInputType } from "../type";

export class ProductAttributeOptionInputDto {
  @ApiProperty({
    example: "white",
    description: "Stable key; never renamed once a product value uses it.",
  })
  @IsString()
  @Matches(/^[a-z0-9_-]+$/, {
    message:
      "کلید گزینه باید فقط حروف انگلیسی کوچک، عدد، خط فاصله یا زیرخط باشد.",
  })
  @MinLength(1)
  value!: string;

  @ApiProperty({ example: "سفید" })
  @IsString()
  @MinLength(1)
  label!: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class SaveProductAttributeDto {
  @ApiProperty({
    example: "color",
    description: "Stable internal key; never renamed once products use it.",
  })
  @IsString()
  @Matches(/^[a-z0-9_-]+$/, {
    message:
      "کلید ویژگی باید فقط حروف انگلیسی کوچک، عدد، خط فاصله یا زیرخط باشد.",
  })
  @MinLength(1)
  key!: string;

  @ApiProperty({ example: "رنگ" })
  @IsString()
  @MinLength(1)
  label!: string;

  @ApiProperty({ example: "select", enum: PRODUCT_ATTRIBUTE_INPUT_TYPES })
  @IsIn(PRODUCT_ATTRIBUTE_INPUT_TYPES)
  inputType!: ProductAttributeInputType;

  @ApiPropertyOptional({ example: "سانتی‌متر" })
  @IsOptional()
  @IsString()
  unit?: string | null;

  @ApiProperty({ example: false })
  @IsBoolean()
  required!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  active!: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({
    example: ["ceramics"],
    enum: STORE_CATEGORIES,
    description:
      "Store category values (Product.category) this attribute applies to — " +
      "not the admin's Persian category labels, which are lossy (several " +
      "labels collapse into one store value).",
  })
  @IsArray()
  @ArrayUnique()
  @IsIn(STORE_CATEGORIES, { each: true })
  categories!: string[];

  @ApiPropertyOptional({ type: [ProductAttributeOptionInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ATTRIBUTE_OPTIONS)
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeOptionInputDto)
  options?: ProductAttributeOptionInputDto[];
}
