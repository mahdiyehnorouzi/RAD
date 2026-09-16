import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateReviewDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({ example: "Beautiful glaze and perfect size for daily use." })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  comment!: string;

  @ApiPropertyOptional({
    example: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD...",
    description: "Optional review photo as a data URL",
  })
  @IsOptional()
  @IsString()
  image?: string;
}
