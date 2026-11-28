import { Module } from "@nestjs/common";
import { AdminGuard } from "../common/guards/admin.guard";
import { AdminCategoriesController } from "./admin-categories.controller";
import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "./categories.service";

@Module({
  controllers: [CategoriesController, AdminCategoriesController],
  providers: [CategoriesService, AdminGuard],
  exports: [CategoriesService],
})
export class CategoriesModule {}
