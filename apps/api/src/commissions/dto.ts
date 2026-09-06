import { Allow, IsBoolean, IsIn, IsObject, IsOptional, IsString, MinLength } from "class-validator";
import type { LocaleCopy, MakingBrief, MakingCommission } from "./commission.types";

export class CreateCommissionDto {
  @IsString()
  @MinLength(1)
  customerName!: string;

  @IsObject()
  brief!: MakingBrief;

  @IsOptional()
  @IsObject()
  title?: LocaleCopy;
}

export class SaveCommissionDto {
  @Allow()
  payload!: MakingCommission;
}

export class CommissionMessageDto {
  @IsObject()
  body!: LocaleCopy;

  @IsOptional()
  @IsBoolean()
  internal?: boolean;
}

export class CommissionDecideDto {
  @IsIn(["approve", "request_change", "offer_alternative", "decline"])
  decision!: "approve" | "request_change" | "offer_alternative" | "decline";

  @IsOptional()
  @IsObject()
  reason?: LocaleCopy;

  @IsOptional()
  @IsObject()
  alternative?: LocaleCopy;

  @IsOptional()
  @IsObject()
  change?: {
    whatChanged: LocaleCopy;
    whyNecessary: LocaleCopy;
    priceImpact: LocaleCopy;
    timeImpact: LocaleCopy;
  };
}
