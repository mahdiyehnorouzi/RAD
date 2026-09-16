import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class GenerateDesignDto {
  @ApiProperty({
    example: "A tall ceramic vase with matte white glaze and subtle vertical ridges",
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  prompt!: string;
}
