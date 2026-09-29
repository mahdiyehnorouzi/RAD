import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { LocalizedTextDto } from "../../common/dto";
import { POLICY_SLUGS } from "../../policies/const";
import type { PolicySlug } from "../../policies/type";

export class HelpMoreDto {
  @ApiProperty({ example: "returns", enum: POLICY_SLUGS })
  @IsIn(POLICY_SLUGS)
  slug!: PolicySlug;

  @ApiPropertyOptional({ example: "window", description: "Section anchor inside the document" })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Matches(/^[a-z0-9-]*$/, { message: "بخش فقط حروف انگلیسی کوچک، عدد و خط تیره می‌پذیرد." })
  section?: string;
}

export class SaveHelpQuestionDto {
  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  question!: LocalizedTextDto;

  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  answer!: LocalizedTextDto;

  @ApiPropertyOptional({
    type: HelpMoreDto,
    nullable: true,
    description: "Policy document with the full rule; null removes the link",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => HelpMoreDto)
  more?: HelpMoreDto | null;
}
