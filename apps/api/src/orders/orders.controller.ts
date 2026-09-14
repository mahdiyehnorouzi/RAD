import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { CheckoutDto } from "./dto/checkout.dto";
import { ConfirmPaymentDto } from "./dto/confirm-payment.dto";
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

  @Get(":id")
  async get(@Param("id") id: string, @Req() request: AuthedRequest) {
    return this.orders.get(await this.identity.fromRequest(request), id);
  }

  @Post()
  async checkout(@Body() body: CheckoutDto, @Req() request: AuthedRequest) {
    return this.orders.checkout(await this.identity.fromRequest(request), body);
  }

  @Post(":id/demo-pay")
  async demoPay(
    @Param("id") id: string,
    @Body() body: ConfirmPaymentDto,
    @Req() request: AuthedRequest,
  ) {
    return this.orders.confirmPayment(
      await this.identity.fromRequest(request),
      id,
      body,
    );
  }

  /** Customer submits transfer receipt; admin later confirms the order. */
  @Post(":id/confirm-payment")
  async confirmPayment(
    @Param("id") id: string,
    @Body() body: ConfirmPaymentDto,
    @Req() request: AuthedRequest,
  ) {
    return this.orders.confirmPayment(
      await this.identity.fromRequest(request),
      id,
      body,
    );
  }

  @Post(":id/cancel")
  async cancel(@Param("id") id: string, @Req() request: AuthedRequest) {
    return this.orders.cancel(await this.identity.fromRequest(request), id);
  }
}
