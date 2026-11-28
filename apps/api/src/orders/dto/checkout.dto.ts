import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CheckoutDto {
  @ApiPropertyOptional({ example: "Mahdiyeh Norozi" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "09121234567" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: "Tehran" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: "Valiasr St, No. 42" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description:
      "Optional note for RAD staff, shown only in admin order review.",
    example: "لطفاً با روکش اضافه بسته‌بندی شود.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  recipientName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  recipientPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(240)
  giftMessage?: string;

  @ApiPropertyOptional({
    description:
      "Version of each purchase rule the buyer read and accepted; must match the current versions",
    example: {
      buying: "2026-11-09",
      shipping: "2026-11-09",
      returns: "2026-11-09",
      terms: "2026-11-09",
      privacy: "2026-09-27",
    },
  })
  @IsOptional()
  @IsObject()
  acceptedPolicies?: Record<string, string>;

  /**
   * Method only. The fee is quoted by the server from this value and the
   * city; a client-supplied amount is not a field on this DTO.
   */
  @ApiPropertyOptional({ enum: ["express", "courier"] })
  @IsOptional()
  @IsIn(["express", "courier"])
  shippingMethod?: "express" | "courier";
}
