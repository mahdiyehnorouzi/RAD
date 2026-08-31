import { IsString, MinLength } from "class-validator";

export class AddCartItemDto {
  @IsString()
  @MinLength(1)
  slug!: string;
}
