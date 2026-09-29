import { Controller, Get, Req } from "@nestjs/common";
import { SessionService } from "./session.service";
import { IdentityService } from "../common/identity.service";
import type { AuthedRequest } from "../common/session.middleware";

@Controller("session")
export class SessionController {
  constructor(
    private readonly session: SessionService,
    private readonly identity: IdentityService,
  ) {}

  @Get()
  async state(@Req() request: AuthedRequest) {
    return this.session.state(await this.identity.fromRequest(request));
  }
}
