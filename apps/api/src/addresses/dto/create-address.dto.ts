import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";
import { SaveAddressDto } from "./save-address.dto";

/** Create may choose the default. Updates cannot; use the default route. */
export class CreateAddressDto extends SaveAddressDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
