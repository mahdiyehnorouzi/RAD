import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class OtpVerifyDto {
  @ApiProperty({ example: "09121234567" })
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone!: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @MinLength(4)
  @MaxLength(10)
  code!: string;
}
