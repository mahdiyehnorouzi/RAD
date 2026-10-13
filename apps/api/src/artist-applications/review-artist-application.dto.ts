import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { ARTIST_APPLICATION_STATUSES } from "./const";

export class ReviewArtistApplicationDto {
  @ApiProperty({ example: "approved", enum: ARTIST_APPLICATION_STATUSES })
  @IsIn(ARTIST_APPLICATION_STATUSES)
  status!: string;

  @ApiPropertyOptional({ example: "نمونه‌کارها عالی بود؛ برای همکاری تماس گرفته شد." })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNote?: string;
}
