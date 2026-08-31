import { IsIn, IsOptional, IsString } from "class-validator";

export class CreateNoticeDto {
  @IsIn(["favorite", "cart", "welcome", "order"])
  kind!: "favorite" | "cart" | "welcome" | "order";

  @IsOptional()
  @IsString()
  productSlug?: string;
}
