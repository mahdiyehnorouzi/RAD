import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { LocalizedTextDto } from "../../common/dto";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class SaveCategoryDto {
  @ApiProperty({ example: "ceramics" })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(SLUG, {
    message: "شناسه فقط حروف انگلیسی کوچک، عدد و خط تیره می‌پذیرد.",
  })
  slug!: string;

  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  name!: LocalizedTextDto;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  /** Null or omitted creates a parent. A child must name an existing parent. */
  @ApiPropertyOptional({ nullable: true, example: null })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MinLength(1)
  parentId?: string | null;
}
