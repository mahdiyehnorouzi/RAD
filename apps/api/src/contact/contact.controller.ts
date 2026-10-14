import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ContactService } from "./contact.service";
import { CreateContactMessageDto, ReplyContactMessageDto } from "./dto";
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

  /** The customer's own reply into a thread they started (or own the order of). */
  @Post("messages/:id/reply")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async reply(
    @Param("id") id: string,
    @Body() body: ReplyContactMessageDto,
    @Req() request: AuthedRequest,
  ) {
    return this.contact.replyAsCustomer(
      await this.identity.fromRequest(request),
      id,
      body.body,
    );
  }

  /** Every message thread tied to an order the signed-in visitor owns. */
  @Get("messages")
  async listForOrder(
    @Query("orderId") orderId: string,
    @Req() request: AuthedRequest,
  ) {
    return this.contact.listThreadsForOrder(
      await this.identity.fromRequest(request),
      orderId,
    );
  }
}
