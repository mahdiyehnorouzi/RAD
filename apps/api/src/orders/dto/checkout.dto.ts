import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

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
}
