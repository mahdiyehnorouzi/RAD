import { ApiProperty } from "@nestjs/swagger";
import { ArrayMaxSize, ArrayUnique, IsArray, IsString } from "class-validator";

export class ReorderDto {
  @ApiProperty({
    example: ["crooked", "quiet", "worn"],
    description: "Every id in the new display order",
  })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  ids!: string[];
}
