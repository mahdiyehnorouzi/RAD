import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength } from "class-validator";

function trimString({ value }: { value: unknown }) {
  return typeof value === "string" ? value.trim() : value;
}

/**
 * Delivery fields checkout already collects. Length bounds here are a
 * sanity check. The Iranian mobile, province/city pair, street length,
 * and 10-digit postal code are enforced in `parseAddressInput`.
 * `userId` is not accepted; the session owns the row.
 */
export class SaveAddressDto {
  @ApiProperty({ example: "سارا محمدی" })
  @Transform(trimString)
  @IsString()
  @MaxLength(200)
  recipientName!: string;

  @ApiProperty({ example: "09121234567" })
  @Transform(trimString)
  @IsString()
  @MaxLength(32)
  phone!: string;

  @ApiProperty({ example: "province:8" })
  @Transform(trimString)
  @IsString()
  @MaxLength(64)
  provinceId!: string;

  @ApiProperty({ example: "county:8" })
  @Transform(trimString)
  @IsString()
  @MaxLength(64)
  cityId!: string;

  @ApiProperty({ example: "خیابان ولیعصر، کوچه ۱۲، پلاک ۴" })
  @Transform(trimString)
  @IsString()
  @MaxLength(2000)
  address!: string;

  @ApiPropertyOptional({ example: "1234567890" })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(32)
  postalCode?: string;
}
