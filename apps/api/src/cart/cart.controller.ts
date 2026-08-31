import { Body, Controller, Delete, Get, Param, Post, Req } from "@nestjs/common";
import { CartService } from "./cart.service";
import { AddCartItemDto } from "./dto/add-item.dto";
import { IdentityService } from "../common/identity.service";
import type { AuthedRequest } from "../common/session.middleware";

@Controller("cart")
export class CartController {
  constructor(
    private readonly cart: CartService,
    private readonly identity: IdentityService,
  ) {}

  @Get()
  async get(@Req() request: AuthedRequest) {
    return this.cart.get(await this.identity.fromRequest(request));
  }

  @Post("items")
  async add(@Body() body: AddCartItemDto, @Req() request: AuthedRequest) {
    return this.cart.add(await this.identity.fromRequest(request), body.slug);
  }

  @Delete("items/:slug")
  async remove(@Param("slug") slug: string, @Req() request: AuthedRequest) {
    return this.cart.remove(await this.identity.fromRequest(request), slug);
  }

  @Delete()
  async clear(@Req() request: AuthedRequest) {
    return this.cart.clear(await this.identity.fromRequest(request));
  }
}
