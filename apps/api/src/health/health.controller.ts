import { Controller, Get } from "@nestjs/common";
import { APP_VERSION } from "../version";

@Controller("health")
export class HealthController {
  @Get()
  check() {
    return {
      ok: true,
      service: "rad-api",
      version: process.env.RAD_VERSION ?? APP_VERSION,
    };
  }
}
