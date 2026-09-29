import { Module } from "@nestjs/common";
import { SessionController } from "./session.controller";
import { SessionService } from "./session.service";
import { FavoritesModule } from "../favorites/favorites.module";
import { NoticesModule } from "../notices/notices.module";

@Module({
  imports: [FavoritesModule, NoticesModule],
  controllers: [SessionController],
  providers: [SessionService],
})
export class SessionModule {}
