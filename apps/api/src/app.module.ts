import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { CommonModule } from "./common/common.module";
import { SessionMiddleware } from "./common/session.middleware";
import { ApiExceptionFilter } from "./common/http-exception.filter";
import { AuthModule } from "./auth/auth.module";
import { CatalogModule } from "./catalog/catalog.module";
import { CartModule } from "./cart/cart.module";
import { FavoritesModule } from "./favorites/favorites.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { OrdersModule } from "./orders/orders.module";
import { NoticesModule } from "./notices/notices.module";
import { DesignModule } from "./design/design.module";
import { AdminModule } from "./admin/admin.module";
import { MailModule } from "./mail/mail.module";
import { HealthController } from "./health/health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET") ?? "rad-dev-secret-change-me",
        signOptions: { expiresIn: "7d" },
      }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
    }),
    PrismaModule,
    CommonModule,
    MailModule,
    AuthModule,
    CatalogModule,
    CartModule,
    FavoritesModule,
    ReviewsModule,
    NoticesModule,
    OrdersModule,
    DesignModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    SessionMiddleware,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionMiddleware).forRoutes("*");
  }
}
