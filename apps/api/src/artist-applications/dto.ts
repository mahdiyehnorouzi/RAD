import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { ABOUT_MAX, ARTWORK_CATEGORIES, ARTWORK_IMAGE_MAX, SHIPPING_METHODS } from "./const";

export class CreateArtistApplicationDto {
  @ApiProperty({ example: "سارا محمدی" })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  fullName!: string;

  @ApiPropertyOptional({ example: "سار" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  artistName?: string;

  @ApiProperty({ example: "09123456789" })
  @IsString()
  @MinLength(5)
  @MaxLength(60)
  contact!: string;

  @ApiProperty({ example: "تهران" })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  city!: string;

  @ApiPropertyOptional({ example: "saar_art" })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  instagram?: string;

  @ApiProperty({
    description: "1 to 5 sample photos as JPEG, PNG or WebP data URLs",
    example: ["data:image/jpeg;base64,..."],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(ARTWORK_IMAGE_MAX)
  @IsString({ each: true })
  artworkImages!: string[];

  @ApiPropertyOptional({ example: "چند خط درباره سبک و متریال آثار" })
  @IsOptional()
  @IsString()
  @MaxLength(ABOUT_MAX)
  about?: string;

  @ApiProperty({ example: ["ceramics"], enum: ARTWORK_CATEGORIES })
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(ARTWORK_CATEGORIES, { each: true })
  categories!: string[];

  @ApiProperty({ example: "studio_dropoff", enum: SHIPPING_METHODS })
  @IsIn(SHIPPING_METHODS)
  shippingMethod!: string;

  @ApiPropertyOptional({ example: "به زودی" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  availability?: string;
}
