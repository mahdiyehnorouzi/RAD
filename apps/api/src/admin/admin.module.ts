import { Module } from "@nestjs/common";
import { NoticesModule } from "../notices/notices.module";
import { CommissionsModule } from "../commissions/commissions.module";
import { OrdersModule } from "../orders/orders.module";
import { ContactModule } from "../contact/contact.module";
import { DamageReportsModule } from "../damage/damage-reports.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminGuard } from "../common/guards/admin.guard";

@Module({
  imports: [
    NoticesModule,
    CommissionsModule,
    OrdersModule,
    ContactModule,
    DamageReportsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
