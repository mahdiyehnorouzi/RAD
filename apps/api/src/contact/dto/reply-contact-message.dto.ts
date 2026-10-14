import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";
import { CONTACT_BODY_MAX } from "../const";

export class ReplyContactMessageDto {
  @ApiProperty({ example: "رسیدتون رو بررسی کردیم، تا فردا تایید میشه." })
  @IsString()
  @MinLength(1)
  @MaxLength(CONTACT_BODY_MAX)
  body!: string;
}
