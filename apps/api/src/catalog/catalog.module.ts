import { Module } from "@nestjs/common";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";
import { MediaController } from "./media.controller";

@Module({
  controllers: [CatalogController, MediaController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
