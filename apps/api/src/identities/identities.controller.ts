import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { IdentitiesService } from "./identities.service";

@Controller("identities")
export class IdentitiesController {
  constructor(private readonly identities: IdentitiesService) {}

  @Get(":code")
  async byCode(@Param("code") code: string) {
    const identity = await this.identities.resolvePublic(code);
    if (!identity) throw new NotFoundException("این شماره رَد پیدا نشد.");
    return identity;
  }
}
