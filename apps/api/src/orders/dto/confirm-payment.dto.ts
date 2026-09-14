import { IsString, MinLength } from "class-validator";

export class ConfirmPaymentDto {
  @IsString()
  @MinLength(32)
  receiptImage!: string;
}
