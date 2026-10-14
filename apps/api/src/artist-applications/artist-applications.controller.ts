import { Body, Controller, Post, Req } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { IdentityService } from "../common/identity.service";
import type { AuthedRequest } from "../common/session.middleware";
import { ArtistApplicationsService } from "./artist-applications.service";
import { CreateArtistApplicationDto } from "./dto";

@Controller("artist-applications")
export class ArtistApplicationsController {
  constructor(
    private readonly applications: ArtistApplicationsService,
    private readonly identity: IdentityService,
  ) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async create(
    @Body() body: CreateArtistApplicationDto,
    @Req() request: AuthedRequest,
  ) {
    return this.applications.create(
      await this.identity.fromRequest(request),
      body,
    );
  }
}
