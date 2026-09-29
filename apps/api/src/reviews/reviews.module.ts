import { Module } from "@nestjs/common";
import { ReviewFeedController } from "./review-feed.controller";
import { ReviewsController } from "./reviews.controller";
import { ReviewsService } from "./reviews.service";

@Module({
  controllers: [ReviewsController, ReviewFeedController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
