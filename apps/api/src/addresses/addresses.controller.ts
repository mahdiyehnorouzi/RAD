import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { IdentityService } from "../common/identity.service";
import { AuthGuard } from "../common/guards/auth.guard";
import type { AuthedRequest } from "../common/session.middleware";
import { AddressesService } from "./addresses.service";
import { CreateAddressDto } from "./dto/create-address.dto";
import { SaveAddressDto } from "./dto/save-address.dto";

@Controller("account/addresses")
@UseGuards(AuthGuard)
export class AddressesController {
  constructor(
    private readonly addresses: AddressesService,
    private readonly identity: IdentityService,
  ) {}

  @Get()
  async list(@Req() request: AuthedRequest) {
    return this.addresses.list(await this.identity.fromRequest(request));
  }

  @Post()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async create(@Body() body: CreateAddressDto, @Req() request: AuthedRequest) {
    return this.addresses.create(
      await this.identity.fromRequest(request),
      body,
    );
  }

  @Patch(":id")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async update(
    @Param("id") id: string,
    @Body() body: SaveAddressDto,
    @Req() request: AuthedRequest,
  ) {
    return this.addresses.update(
      await this.identity.fromRequest(request),
      id,
      body,
    );
  }

  @Post(":id/default")
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async setDefault(@Param("id") id: string, @Req() request: AuthedRequest) {
    return this.addresses.setDefault(
      await this.identity.fromRequest(request),
      id,
    );
  }

  @Delete(":id")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async remove(@Param("id") id: string, @Req() request: AuthedRequest) {
    return this.addresses.remove(await this.identity.fromRequest(request), id);
  }
}
