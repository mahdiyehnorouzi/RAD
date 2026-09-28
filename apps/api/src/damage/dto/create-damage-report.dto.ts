import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";
import { DAMAGE_BODY_MAX } from "../const";

export class CreateDamageReportDto {
  @ApiProperty({ example: "RAD-104233" })
  @IsString()
  @MaxLength(32)
  orderId!: string;

  @ApiProperty({
    example: "data:image/jpeg;base64,...",
    description: "The outer box as it arrived (JPEG, PNG or WebP data URL)",
  })
  @IsString()
  packagingPhoto!: string;

  @ApiProperty({
    example: "data:image/jpeg;base64,...",
    description: "The damage itself (JPEG, PNG or WebP data URL)",
  })
  @IsString()
  damagePhoto!: string;

  @ApiProperty({ example: "لبه‌ی کاسه از یک طرف ترک خورده بود." })
  @IsString()
  @MinLength(3)
  @MaxLength(DAMAGE_BODY_MAX)
  body!: string;
}
