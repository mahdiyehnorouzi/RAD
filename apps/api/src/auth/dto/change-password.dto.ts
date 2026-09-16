import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({ example: "current-password", minLength: 8 })
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @ApiProperty({ example: "new-password123", minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
