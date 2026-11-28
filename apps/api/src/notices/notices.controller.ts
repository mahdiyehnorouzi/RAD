import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { NoticesService } from "./notices.service";
import { CreateNoticeDto } from "./dto/create-notice.dto";
import { IdentityService } from "../common/identity.service";
import type { AuthedRequest } from "../common/session.middleware";

@Controller("notices")
export class NoticesController {
  constructor(
    private readonly notices: NoticesService,
    private readonly identity: IdentityService,
  ) {}

  @Get()
  async list(@Req() request: AuthedRequest) {
    return this.notices.list(await this.identity.fromRequest(request));
  }

  @Post()
  async create(@Body() body: CreateNoticeDto, @Req() request: AuthedRequest) {
    return this.notices.create(
      await this.identity.fromRequest(request),
      body.kind,
      body.productSlug,
    );
  }

  @Post("commissions/:id/read")
  async markCommissionMessagesRead(
    @Param("id") id: string,
    @Req() request: AuthedRequest,
  ) {
    return this.notices.markCommissionMessagesRead(
      await this.identity.fromRequest(request),
      id,
    );
  }

  @Post(":id/read")
  async markRead(@Param("id") id: string, @Req() request: AuthedRequest) {
    return this.notices.markRead(await this.identity.fromRequest(request), id);
  }

  @Post("read")
  async markAllRead(@Req() request: AuthedRequest) {
    return this.notices.markAllRead(await this.identity.fromRequest(request));
  }
}
