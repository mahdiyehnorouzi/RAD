import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";
import type { StoredNoticeKind } from "../notice-kinds";

const noticeKinds = [
  "favorite",
  "cart",
  "welcome",
  "order",
  "commission_approved",
  "commission_declined",
  "commission_change",
  "commission_message",
  "commission_quote",
  "commission_pre_kiln",
  "commission_firing",
  "commission_balance",
  "commission_shipped",
] as const satisfies readonly StoredNoticeKind[];

export class CreateNoticeDto {
  @ApiProperty({ example: "favorite", enum: noticeKinds })
  @IsIn([...noticeKinds])
  kind!: StoredNoticeKind;

  @ApiPropertyOptional({ example: "moon-vase" })
  @IsOptional()
  @IsString()
  productSlug?: string;
}
