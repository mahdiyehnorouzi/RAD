import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { GoogleAuthService } from "./google-auth.service";
import { OtpService } from "./otp.service";
import { ProfileService } from "./profile.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, GoogleAuthService, OtpService, ProfileService],
  exports: [AuthService, OtpService],
})
export class AuthModule {}
