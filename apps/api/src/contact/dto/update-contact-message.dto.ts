import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import { CONTACT_MESSAGE_STATUSES } from "../const";
import type { ContactMessageStatus } from "../type";

export class UpdateContactMessageDto {
  @ApiProperty({ example: "resolved", enum: CONTACT_MESSAGE_STATUSES })
  @IsIn(CONTACT_MESSAGE_STATUSES)
  status!: ContactMessageStatus;
}
