import { ApiPropertyOptional } from "@nestjs/swagger";
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

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: "ceramics" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(SLUG, {
    message: "شناسه فقط حروف انگلیسی کوچک، عدد و خط تیره می‌پذیرد.",
  })
  slug?: string;

  @ApiPropertyOptional({ type: LocalizedTextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  name?: LocalizedTextDto;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  /**
   * Changing this moves the row under another parent, or makes it a parent
   * when null. A subcategory that products use cannot move.
   */
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MinLength(1)
  parentId?: string | null;
}
