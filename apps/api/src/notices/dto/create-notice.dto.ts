import { IsIn, IsOptional, IsString } from "class-validator";

export class CreateNoticeDto {
  @IsIn([
    "favorite",
    "cart",
    "welcome",
    "order",
    "commission_approved",
    "commission_declined",
    "commission_change",
    "commission_message",
  ])
  kind!:
    | "favorite"
    | "cart"
    | "welcome"
    | "order"
    | "commission_approved"
    | "commission_declined"
    | "commission_change"
    | "commission_message";

  @IsOptional()
  @IsString()
  productSlug?: string;
}
