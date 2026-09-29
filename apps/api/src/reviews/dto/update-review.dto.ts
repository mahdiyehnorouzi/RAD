import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class UpdateReviewDto {
  @ApiProperty({ example: true, description: "Hide the review from the storefront" })
  @IsBoolean()
  hidden!: boolean;
}
