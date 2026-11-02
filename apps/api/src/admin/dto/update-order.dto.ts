import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { STORE_ORDER_STATUSES } from "../../orders/const";

export class UpdateOrderDto {
  @ApiProperty({ example: "packing", enum: STORE_ORDER_STATUSES })
  @IsIn(STORE_ORDER_STATUSES)
  status!: string;

  @ApiPropertyOptional({ example: "IR-POST-123456789" })
  @IsOptional()
  @IsString({ message: "کد رهگیری نامعتبر است." })
  // Payload sanity bound only, not the business rule: AdminService
  // normalizes (strips spaces/dashes, converts Persian digits) and
  // requires 4-32 alnum chars via the same `normalizeTrackingNumber`
  // customers' receipt tracking numbers use. Keep the real rule
  // single-sourced there.
  @MaxLength(40, { message: "کد رهگیری خیلی طولانی است." })
  trackingCode?: string;
}
