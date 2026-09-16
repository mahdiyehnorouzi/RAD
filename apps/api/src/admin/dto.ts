import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";

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

  @ApiProperty({
    example: "گلدان",
    enum: [
      "گلدان",
      "ظروف",
      "مجسمه",
      "سفال و سرامیک",
      "نقاشی",
      "پارچه و بافت",
      "آثار چوبی",
      "زیورآلات هنری",
      "چاپ دستی و تصویر",
    ],
  })
  @IsIn([
    "گلدان",
    "ظروف",
    "مجسمه",
    "سفال و سرامیک",
    "نقاشی",
    "پارچه و بافت",
    "آثار چوبی",
    "زیورآلات هنری",
    "چاپ دستی و تصویر",
  ])
  category!: string;

  @ApiProperty({ example: 8500000 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  price!: number;

  @ApiProperty({ example: "available", enum: ["draft", "available", "reserved", "sold"] })
  @IsIn(["draft", "available", "reserved", "sold"])
  status!: "draft" | "available" | "reserved" | "sold";

  @ApiProperty({ example: "استودیو رَد" })
  @IsString()
  @MinLength(1)
  artist!: string;

  @ApiProperty({
    example: [],
    description: "Product images as base64 data URLs",
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  images!: string[];
}

export class UpdateOrderDto {
  @ApiProperty({
    example: "confirmed",
    enum: [
      "payment_pending",
      "confirmed",
      "packing",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
    ],
  })
  @IsIn([
    "payment_pending",
    "confirmed",
    "packing",
    "shipped",
    "delivered",
    "cancelled",
    "returned",
  ])
  status!: string;

  @ApiPropertyOptional({ example: "IR-POST-123456789" })
  @IsOptional()
  @IsString()
  trackingCode?: string;
}

export class InviteMemberDto {
  @ApiProperty({ example: "Sara Ahmadi" })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: "editor@rad.studio" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "editor", enum: ["manager", "editor", "viewer"] })
  @IsIn(["manager", "editor", "viewer"])
  role!: "manager" | "editor" | "viewer";
}

export class UpdateMemberDto {
  @ApiPropertyOptional({ example: "editor", enum: ["owner", "manager", "editor", "viewer"] })
  @IsOptional()
  @IsIn(["owner", "manager", "editor", "viewer"])
  role?: "owner" | "manager" | "editor" | "viewer";

  @ApiPropertyOptional({ example: "active", enum: ["active", "invited"] })
  @IsOptional()
  @IsIn(["active", "invited"])
  status?: "active" | "invited";
}
