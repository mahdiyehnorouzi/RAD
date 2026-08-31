import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { CheckoutDto } from "./dto/checkout.dto";
import { IdentityService } from "../common/identity.service";
import type { AuthedRequest } from "../common/session.middleware";

@Controller("orders")
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly identity: IdentityService,
  ) {}

  @Get()
  async list(@Req() request: AuthedRequest) {
    return this.orders.list(await this.identity.fromRequest(request));
  }

  @Post()
  async checkout(@Body() body: CheckoutDto, @Req() request: AuthedRequest) {
    return this.orders.checkout(await this.identity.fromRequest(request), body);
  }
}
