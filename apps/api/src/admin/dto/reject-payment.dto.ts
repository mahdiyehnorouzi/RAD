import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";
import { PAYMENT_REJECTION_REASON_MAX } from "../../orders/const";

export class RejectPaymentDto {
  @ApiProperty({
    example: "مبلغ واریزی با مبلغ سفارش مطابقت ندارد.",
    description: "Shown to the customer on the order page and in the notice email",
  })
  @IsString()
  @MinLength(3)
  @MaxLength(PAYMENT_REJECTION_REASON_MAX)
  reason!: string;
}
