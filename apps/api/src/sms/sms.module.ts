import { Global, Module } from "@nestjs/common";
import { MelipayamakConsoleOtpService } from "./melipayamak-console-otp.service";
import { MelipayamakConsoleService } from "./melipayamak-console.service";

@Global()
@Module({
  providers: [MelipayamakConsoleOtpService, MelipayamakConsoleService],
  exports: [MelipayamakConsoleOtpService, MelipayamakConsoleService],
})
export class SmsModule {}
