import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsInt, IsOptional, Min } from "class-validator";
import { MEDIA_MIMES } from "../../storage/media-policy";
export class SignProductImageDto {
  @ApiProperty({ enum: MEDIA_MIMES })
  @IsIn(MEDIA_MIMES, { message: "فقط تصویر JPEG، PNG، WebP یا ویدیوی MP4، WebM مجاز است." })
  mime!: string;

  @IsOptional()
  @IsInt()
  @Min(1, { message: "فایل خالی است." })
  size?: number;
}
