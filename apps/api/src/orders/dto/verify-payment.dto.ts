import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

/** The `Authority` + `Status` query params ZarinPal appends to the callback URL. */
export class VerifyPaymentDto {
  @ApiPropertyOptional({ example: "A00000000000000000000000000217914" })
  @IsOptional()
  @IsString()
  authority?: string;

  @ApiPropertyOptional({ example: "OK" })
  @IsOptional()
  @IsString()
  status?: string;
}
