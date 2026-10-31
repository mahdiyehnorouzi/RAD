import { Global, Module } from "@nestjs/common";
import { MelipayamakService } from "./melipayamak.service";

@Global()
@Module({
  providers: [MelipayamakService],
  exports: [MelipayamakService],
})
export class SmsModule {}
