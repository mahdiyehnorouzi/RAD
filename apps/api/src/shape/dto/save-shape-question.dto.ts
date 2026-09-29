import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { LocalizedTextDto } from "../../common/dto";
import { SHAPE_CHOICE_COUNT, SHAPE_TRAITS } from "../const";
import type { ShapeTrait } from "../type";

export class ShapePhotoDto {
  @ApiProperty({
    example: "/shape/q1-straight.jpg",
    description: "Path under the storefront or an absolute http(s) URL",
  })
  @IsString()
  @MaxLength(500)
  @Matches(/^(\/\S*|https?:\/\/\S+)$/, {
    message: "آدرس عکس باید با / یا http شروع شود.",
  })
  src!: string;

  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  alt!: LocalizedTextDto;
}

export class ShapeChoiceDto {
  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  label!: LocalizedTextDto;

  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  note!: LocalizedTextDto;

  @ApiProperty({ type: ShapePhotoDto })
  @ValidateNested()
  @Type(() => ShapePhotoDto)
  photo!: ShapePhotoDto;

  @ApiProperty({ example: 0.15, minimum: 0, maximum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  value!: number;
}

export class SaveShapeQuestionDto {
  @ApiProperty({ example: "crooked", enum: SHAPE_TRAITS })
  @IsIn(SHAPE_TRAITS)
  trait!: ShapeTrait;

  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  prompt!: LocalizedTextDto;

  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  hint!: LocalizedTextDto;

  @ApiProperty({ type: [ShapeChoiceDto], minItems: 2, maxItems: 2 })
  @IsArray()
  @ArrayMinSize(SHAPE_CHOICE_COUNT)
  @ArrayMaxSize(SHAPE_CHOICE_COUNT)
  @ValidateNested({ each: true })
  @Type(() => ShapeChoiceDto)
  choices!: ShapeChoiceDto[];
}
