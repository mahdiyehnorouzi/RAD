import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { ProfileService } from "./profile.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, ProfileService],
  exports: [AuthService],
})
export class AuthModule {}
