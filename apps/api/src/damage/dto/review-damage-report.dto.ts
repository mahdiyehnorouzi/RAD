import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import {
  DAMAGE_NOTE_MAX,
  DAMAGE_REPORT_STATUSES,
  DAMAGE_RESOLUTIONS,
} from "../const";
import type { DamageReportStatus, DamageResolution } from "../type";

export class ReviewDamageReportDto {
  @ApiProperty({ example: "approved", enum: DAMAGE_REPORT_STATUSES })
  @IsIn(DAMAGE_REPORT_STATUSES)
  status!: DamageReportStatus;

  @ApiPropertyOptional({
    example: "repair",
    enum: DAMAGE_RESOLUTIONS,
    description: "Required when approving",
  })
  @IsOptional()
  @IsIn(DAMAGE_RESOLUTIONS)
  resolution?: DamageResolution;

  @ApiPropertyOptional({
    example: "سازنده می‌تواند لبه را مرمت کند؛ پیک برای برداشتن اثر هماهنگ می‌شود.",
    description: "Shown to the customer; required when declining",
  })
  @IsOptional()
  @IsString()
  @MaxLength(DAMAGE_NOTE_MAX)
  note?: string;
}
