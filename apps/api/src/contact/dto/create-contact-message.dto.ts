import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import {
  CONTACT_BODY_MAX,
  CONTACT_REPLY_TO_MAX,
  CONTACT_SOURCES,
  CONTACT_TOPICS,
} from "../const";
import type { ContactSource, ContactTopic } from "../type";

export class CreateContactMessageDto {
  @ApiProperty({ example: "payment", enum: CONTACT_TOPICS })
  @IsIn(CONTACT_TOPICS)
  topic!: ContactTopic;

  @ApiProperty({ example: "order", enum: CONTACT_SOURCES })
  @IsIn(CONTACT_SOURCES)
  source!: ContactSource;

  @ApiPropertyOptional({
    example: "09121234567",
    description: "Email or phone to reply to; defaults to the signed-in email",
  })
  @IsOptional()
  @IsString()
  @MaxLength(CONTACT_REPLY_TO_MAX)
  contact?: string;

  @ApiProperty({ example: "رسید را فرستادم ولی وضعیت سفارش تغییر نکرده." })
  @IsString()
  @MinLength(3)
  @MaxLength(CONTACT_BODY_MAX)
  body!: string;

  @ApiPropertyOptional({ example: "RAD-104233" })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  orderId?: string;
}
