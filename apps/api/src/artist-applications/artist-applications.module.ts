import { Module } from "@nestjs/common";
import { ArtistApplicationsController } from "./artist-applications.controller";
import { ArtistApplicationsService } from "./artist-applications.service";

@Module({
  controllers: [ArtistApplicationsController],
  providers: [ArtistApplicationsService],
  exports: [ArtistApplicationsService],
})
export class ArtistApplicationsModule {}
