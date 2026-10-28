import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class OtpRequestDto {
  @ApiProperty({ example: "09121234567" })
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone!: string;
}
