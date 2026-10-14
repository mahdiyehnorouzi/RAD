import { IsIn, IsString, Matches } from "class-validator";
export class VerifyProductMediaDto {
  @IsString()
  @Matches(/^rad\/(pending|products\/[A-Za-z0-9_-]+)\/[A-Za-z0-9_-]+$/, { message: "شناسه فایل نامعتبر است." })
  objectKey!: string;
  @IsIn(["image", "video"])
  kind!: "image" | "video";
}
