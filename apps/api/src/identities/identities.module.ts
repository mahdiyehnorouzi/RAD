import { Module } from "@nestjs/common";
import { AdminGuard } from "../common/guards/admin.guard";
import { AdminIdentitiesController } from "./admin-identities.controller";
import { IdentitiesController } from "./identities.controller";
import { IdentitiesService } from "./identities.service";
import { IdentityPrintService } from "./identity-print.service";

@Module({
  controllers: [IdentitiesController, AdminIdentitiesController],
  providers: [IdentitiesService, IdentityPrintService, AdminGuard],
  exports: [IdentitiesService],
})
export class IdentitiesModule {}
