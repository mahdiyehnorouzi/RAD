import { Module } from "@nestjs/common";
import { ProductAttributesModule } from "../product-attributes/product-attributes.module";
import { ArtworksController } from "./artworks.controller";
import { ArtworksService } from "./artworks.service";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";
import { MediaController } from "./media.controller";

@Module({
  imports: [ProductAttributesModule],
  controllers: [CatalogController, ArtworksController, MediaController],
  providers: [CatalogService, ArtworksService],
  exports: [CatalogService, ArtworksService],
})
export class CatalogModule {}
