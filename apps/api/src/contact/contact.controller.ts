import { Body, Controller, Post, Req } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ContactService } from "./contact.service";
import { CreateContactMessageDto } from "./dto";
import { IdentityService } from "../common/identity.service";
import type { AuthedRequest } from "../common/session.middleware";

@Controller("contact")
export class ContactController {
  constructor(
    private readonly contact: ContactService,
    private readonly identity: IdentityService,
  ) {}

  @Post("messages")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async create(
    @Body() body: CreateContactMessageDto,
    @Req() request: AuthedRequest,
  ) {
    return this.contact.create(await this.identity.fromRequest(request), body);
  }
}
