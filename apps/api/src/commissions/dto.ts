import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { Allow, IsBoolean, IsIn, IsObject, IsOptional, IsString, MinLength } from "class-validator";
import type { LocaleCopy, MakingBrief, MakingCommission } from "./commission.types";

const localeCopyExample = {
  fa: "متن فارسی",
  en: "English text",
};

const briefExample: MakingBrief = {
  concept: "A hand-thrown bowl with matte glaze",
  dimensions: "20cm diameter, 8cm height",
  material: "Stoneware",
  intendedUse: "Daily dining",
  budget: "5-8 million toman",
  permission: "Artist may suggest material changes",
  category: "tableware",
};

export class CreateCommissionDto {
  @ApiProperty({ example: "Mahdiyeh Norozi" })
  @IsString()
  @MinLength(1)
  customerName!: string;

  @ApiProperty({ example: briefExample })
  @IsObject()
  brief!: MakingBrief;

  @ApiPropertyOptional({
    example: { fa: "کاسه سفارشی", en: "Custom bowl" },
  })
  @IsOptional()
  @IsObject()
  title?: LocaleCopy;
}

export class SaveCommissionDto {
  @ApiProperty({
    description: "Full commission payload as returned by GET /commissions/:id",
    example: {
      id: "cm-abc123",
      title: { fa: "کاسه سفارشی", en: "Custom bowl" },
      customerName: "Mahdiyeh Norozi",
      artistName: "RAD Studio",
      brief: briefExample,
      stage: "design_submitted",
      nextActor: "artist",
      estimatedCompletion: 1_700_000_000_000,
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_000_000,
      kilnLocked: false,
      messages: [],
      changeRequests: [],
      updates: [],
      payments: [],
      audit: [],
      internalNotes: [],
    },
  })
  @Allow()
  payload!: MakingCommission;
}

export class CommissionMessageDto {
  @ApiProperty({
    example: {
      fa: "سلام، لطفاً ابعاد نهایی را تأیید کنید.",
      en: "Hello, please confirm the final dimensions.",
    },
  })
  @IsObject()
  body!: LocaleCopy;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  internal?: boolean;
}

export class CommissionDecideDto {
  @ApiProperty({
    example: "approve",
    enum: ["approve", "request_change", "offer_alternative", "decline"],
  })
  @IsIn(["approve", "request_change", "offer_alternative", "decline"])
  decision!: "approve" | "request_change" | "offer_alternative" | "decline";

  @ApiPropertyOptional({ example: localeCopyExample })
  @IsOptional()
  @IsObject()
  reason?: LocaleCopy;

  @ApiPropertyOptional({ example: localeCopyExample })
  @IsOptional()
  @IsObject()
  alternative?: LocaleCopy;

  @ApiPropertyOptional({
    example: {
      whatChanged: localeCopyExample,
      whyNecessary: localeCopyExample,
      priceImpact: localeCopyExample,
      timeImpact: localeCopyExample,
    },
  })
  @IsOptional()
  @IsObject()
  change?: {
    whatChanged: LocaleCopy;
    whyNecessary: LocaleCopy;
    priceImpact: LocaleCopy;
    timeImpact: LocaleCopy;
  };
}
