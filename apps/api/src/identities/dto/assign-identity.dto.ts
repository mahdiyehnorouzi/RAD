import { IsString, MinLength } from "class-validator";

export class AssignIdentityDto {
  @IsString()
  @MinLength(1)
  productId!: string;
}
