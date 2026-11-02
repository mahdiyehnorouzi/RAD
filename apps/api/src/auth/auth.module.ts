import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { OtpService } from "./otp.service";
import { ProfileService } from "./profile.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, OtpService, ProfileService],
  exports: [AuthService, OtpService],
})
export class AuthModule {}
