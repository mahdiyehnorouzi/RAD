import { Module } from "@nestjs/common";
import { NoticesModule } from "../notices/notices.module";
import { CommissionsModule } from "../commissions/commissions.module";
import { OrdersModule } from "../orders/orders.module";
import { ContactModule } from "../contact/contact.module";
import { DamageReportsModule } from "../damage/damage-reports.module";
import { HelpModule } from "../help/help.module";
import { ReviewsModule } from "../reviews/reviews.module";
import { ShapeModule } from "../shape/shape.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminGuard } from "../common/guards/admin.guard";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [
    NoticesModule,
    CommissionsModule,
    OrdersModule,
    ContactModule,
    DamageReportsModule,
    ReviewsModule,
    ShapeModule,
    HelpModule,
    StorageModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
