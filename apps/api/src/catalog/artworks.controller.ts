import { Controller, Get, Param } from "@nestjs/common";
import { ArtworksService } from "./artworks.service";

@Controller("artworks")
export class ArtworksController {
  constructor(private readonly artworks: ArtworksService) {}

  @Get()
  list() {
    return this.artworks.list();
  }

  @Get(":key")
  byKey(@Param("key") key: string) {
    return this.artworks.byKey(key);
  }
}
