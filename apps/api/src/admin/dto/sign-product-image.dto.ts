import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import { ALLOWED_PRODUCT_IMAGE_MIME_TYPES } from "../../storage/cloudinary-storage.service";

export class SignProductImageDto {
  @ApiProperty({ example: "image/jpeg", enum: ALLOWED_PRODUCT_IMAGE_MIME_TYPES })
  @IsIn(ALLOWED_PRODUCT_IMAGE_MIME_TYPES)
  mime!: string;
}
