import {
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";
import { MAX_RAD_IDENTITY_BATCH } from "@rad/types";

export class ReserveIdentityBatchDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_RAD_IDENTITY_BATCH)
  quantity!: number;

  @IsString()
  @MinLength(8)
  @MaxLength(80)
  @Matches(/^[A-Za-z0-9_-]+$/)
  idempotencyKey!: string;
}
