import { Body, Controller, Get, Param, Post, Put, Req } from "@nestjs/common";
import { CommissionsService } from "./commissions.service";
import { CommissionMessageDto, CreateCommissionDto, SaveCommissionDto } from "./dto";
import { IdentityService } from "../common/identity.service";
import type { AuthedRequest } from "../common/session.middleware";

@Controller("commissions")
export class CommissionsController {
  constructor(
    private readonly commissions: CommissionsService,
    private readonly identity: IdentityService,
  ) {}

  @Get()
  async list(@Req() request: AuthedRequest) {
    return this.commissions.listMine(await this.identity.fromRequest(request));
  }

  @Post()
  async create(@Body() body: CreateCommissionDto, @Req() request: AuthedRequest) {
    return this.commissions.create(await this.identity.fromRequest(request), body);
  }

  @Put(":id")
  async save(
    @Param("id") id: string,
    @Body() body: SaveCommissionDto,
    @Req() request: AuthedRequest,
  ) {
    return this.commissions.saveMine(await this.identity.fromRequest(request), id, body.payload);
  }

  @Post(":id/messages")
  async message(
    @Param("id") id: string,
    @Body() body: CommissionMessageDto,
    @Req() request: AuthedRequest,
  ) {
    return this.commissions.addMineMessage(await this.identity.fromRequest(request), id, body.body);
  }
}
