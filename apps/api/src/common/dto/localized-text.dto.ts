import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

/** A required Persian + English pair of editable copy. */
export class LocalizedTextDto {
  @ApiProperty({ example: "صاف یا کج؟" })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  fa!: string;

  @ApiProperty({ example: "Straight or crooked?" })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  en!: string;
}
