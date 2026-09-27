import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { PaymentReviewService } from "./payment-review.service";
import { NoticesModule } from "../notices/notices.module";

@Module({
  imports: [NoticesModule],
  controllers: [OrdersController],
  providers: [OrdersService, PaymentReviewService],
  exports: [PaymentReviewService],
})
export class OrdersModule {}
