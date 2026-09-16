import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class AddCartItemDto {
  @ApiProperty({ example: "moon-vase", description: "Product slug from the catalog" })
  @IsString()
  @MinLength(1)
  slug!: string;
}
