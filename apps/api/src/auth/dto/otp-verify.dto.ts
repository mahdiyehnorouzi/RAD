import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class OtpVerifyDto {
  @ApiProperty({ example: "09121234567" })
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone!: string;

  // Bound is a sanity limit only, not a guarantee of the provider's actual
  // code length (the Melipayamak Console OTP endpoint generates and
  // returns the code itself — see `MelipayamakConsoleOtpService`); do not
  // tighten this to a single length without confirming the provider's
  // contract.
  @ApiProperty({ example: "123456" })
  @IsString()
  @MinLength(4)
  @MaxLength(10)
  code!: string;
}
