import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { IdentityService } from "../common/identity.service";
import type { AuthedRequest } from "../common/session.middleware";
import { DamageReportsService } from "./damage-reports.service";
import { CreateDamageReportDto } from "./dto";

@Controller("damage-reports")
export class DamageReportsController {
  constructor(
    private readonly reports: DamageReportsService,
    private readonly identity: IdentityService,
  ) {}

  @Get()
  async list(@Query("orderId") orderId: string | undefined, @Req() request: AuthedRequest) {
    return this.reports.listMine(await this.identity.fromRequest(request), orderId);
  }

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async create(@Body() body: CreateDamageReportDto, @Req() request: AuthedRequest) {
    return this.reports.create(await this.identity.fromRequest(request), body);
  }
}
