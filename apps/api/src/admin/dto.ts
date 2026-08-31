import { Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";

export class SaveProductDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(1)
  slug!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsIn(["گلدان", "ظروف", "مجسمه"])
  category!: "گلدان" | "ظروف" | "مجسمه";

  @Type(() => Number)
  @IsInt()
  @Min(1)
  price!: number;

  @IsIn(["draft", "available", "reserved", "sold"])
  status!: "draft" | "available" | "reserved" | "sold";

  @IsString()
  @MinLength(1)
  artist!: string;

  @IsArray()
  @IsString({ each: true })
  images!: string[];
}

export class UpdateOrderDto {
  @IsIn([
    "received",
    "approved",
    "forming",
    "drying",
    "firing",
    "glazing",
    "quality",
    "shipped",
    "delivered",
  ])
  status!: string;
}

export class InviteMemberDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;

  @IsIn(["manager", "editor", "viewer"])
  role!: "manager" | "editor" | "viewer";
}

export class UpdateMemberDto {
  @IsOptional()
  @IsIn(["owner", "manager", "editor", "viewer"])
  role?: "owner" | "manager" | "editor" | "viewer";

  @IsOptional()
  @IsIn(["active", "invited"])
  status?: "active" | "invited";
}
