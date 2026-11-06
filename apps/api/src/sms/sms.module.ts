import { Global, Module } from "@nestjs/common";
import { MelipayamakConsoleService } from "./melipayamak-console.service";
import { MelipayamakService } from "./melipayamak.service";

@Global()
@Module({
  providers: [MelipayamakService, MelipayamakConsoleService],
  exports: [MelipayamakService, MelipayamakConsoleService],
})
export class SmsModule {}
