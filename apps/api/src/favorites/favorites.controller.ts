import { Controller, Get, Param, Post, Req } from "@nestjs/common";
import { FavoritesService } from "./favorites.service";
import { IdentityService } from "../common/identity.service";
import type { AuthedRequest } from "../common/session.middleware";

@Controller("favorites")
export class FavoritesController {
  constructor(
    private readonly favorites: FavoritesService,
    private readonly identity: IdentityService,
  ) {}

  @Get()
  async list(@Req() request: AuthedRequest) {
    return this.favorites.list(await this.identity.fromRequest(request));
  }

  @Post(":slug")
  async toggle(@Param("slug") slug: string, @Req() request: AuthedRequest) {
    return this.favorites.toggle(await this.identity.fromRequest(request), slug);
  }
}
