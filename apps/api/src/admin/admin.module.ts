import { Module } from "@nestjs/common";
import { NoticesModule } from "../notices/notices.module";
import { CommissionsModule } from "../commissions/commissions.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminGuard } from "../common/guards/admin.guard";

@Module({
  imports: [NoticesModule, CommissionsModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
