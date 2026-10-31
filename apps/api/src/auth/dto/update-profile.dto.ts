import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { PROFILE_NAME_MAX, PROFILE_NAME_MIN } from "../profile-input";

/**
 * The signed-in customer's own name and contact mobile.
 * Email is intentionally absent: it is the login and password-reset
 * address, and changing it needs a verification flow this request does
 * not include. `forbidNonWhitelisted` rejects an `email` (or `id`) field.
 */
export class UpdateProfileDto {
  @ApiProperty({ example: "سارا محمدی", minLength: PROFILE_NAME_MIN })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString({ message: "نام باید حداقل ۲ نویسه باشد." })
  @MinLength(PROFILE_NAME_MIN, { message: "نام باید حداقل ۲ نویسه باشد." })
  @MaxLength(PROFILE_NAME_MAX, {
    message: "نام نباید بیشتر از ۸۰ نویسه باشد.",
  })
  name!: string;

  /**
   * DTO-level sanity bound only. The Iranian-mobile rule lives in
   * `normalizeProfilePhone` (same digits rule as checkout).
   * Empty string clears a saved number.
   */
  @ApiPropertyOptional({ example: "09121234567" })
  @IsOptional()
  @IsString({ message: "شماره موبایل ایرانی معتبر وارد کنید." })
  @MaxLength(32, { message: "شماره موبایل ایرانی معتبر وارد کنید." })
  phone?: string | null;
}
