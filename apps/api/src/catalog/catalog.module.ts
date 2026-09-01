import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";
import { MediaController } from "./media.controller";

@Module({
  imports: [PrismaModule],
  controllers: [CatalogController, MediaController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
