import { IsString, MinLength } from "class-validator";

export class GenerateDesignDto {
  @IsString()
  @MinLength(8)
  prompt!: string;
}
