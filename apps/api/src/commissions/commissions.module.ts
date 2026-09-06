import { Module } from "@nestjs/common";
import { NoticesModule } from "../notices/notices.module";
import { CommissionsController } from "./commissions.controller";
import { CommissionsService } from "./commissions.service";

@Module({
  imports: [NoticesModule],
  controllers: [CommissionsController],
  providers: [CommissionsService],
  exports: [CommissionsService],
})
export class CommissionsModule {}
