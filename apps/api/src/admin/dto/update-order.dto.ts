import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";
import { STORE_ORDER_STATUSES } from "../../orders/const";

export class UpdateOrderDto {
  @ApiProperty({ example: "packing", enum: STORE_ORDER_STATUSES })
  @IsIn(STORE_ORDER_STATUSES)
  status!: string;

  @ApiPropertyOptional({ example: "IR-POST-123456789" })
  @IsOptional()
  @IsString()
  trackingCode?: string;
}
