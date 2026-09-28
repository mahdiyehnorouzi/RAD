import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString } from "class-validator";

export class CheckoutDto {
  @ApiPropertyOptional({ example: "Mahdiyeh Norozi" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "09121234567" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: "Tehran" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: "Valiasr St, No. 42" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description:
      "Version of each purchase rule the buyer read and accepted; must match the current versions",
    example: {
      buying: "2026-09-27",
      shipping: "2026-09-27",
      returns: "2026-09-27",
      terms: "2026-09-27",
      privacy: "2026-09-27",
    },
  })
  @IsOptional()
  @IsObject()
  acceptedPolicies?: Record<string, string>;
}
