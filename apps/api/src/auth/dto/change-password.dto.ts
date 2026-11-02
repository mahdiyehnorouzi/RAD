import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

const PASSWORD_LENGTH = "رمز عبور باید حداقل ۸ نویسه باشد.";

export class ChangePasswordDto {
  @ApiProperty({ example: "current-password", minLength: 8 })
  @IsString({ message: PASSWORD_LENGTH })
  @MinLength(8, { message: PASSWORD_LENGTH })
  currentPassword!: string;

  @ApiProperty({ example: "new-password123", minLength: 8 })
  @IsString({ message: PASSWORD_LENGTH })
  @MinLength(8, { message: PASSWORD_LENGTH })
  newPassword!: string;
}
