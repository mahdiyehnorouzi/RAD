import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { DatabaseModule } from "./database/database.module";
import { CommonModule } from "./common/common.module";
import { InventoryModule } from "./inventory/inventory.module";
import { SessionMiddleware } from "./common/session.middleware";
import { jwtSecret } from "./common/jwt-secret";
import { ApiExceptionFilter } from "./common/http-exception.filter";
import { AuthModule } from "./auth/auth.module";
import { CatalogModule } from "./catalog/catalog.module";
import { CartModule } from "./cart/cart.module";
import { FavoritesModule } from "./favorites/favorites.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { OrdersModule } from "./orders/orders.module";
import { NoticesModule } from "./notices/notices.module";
import { SessionModule } from "./session/session.module";
import { DesignModule } from "./design/design.module";
import { CommissionsModule } from "./commissions/commissions.module";
import { AdminModule } from "./admin/admin.module";
import { ContentModule } from "./content/content.module";
import { HelpModule } from "./help/help.module";
import { ShapeModule } from "./shape/shape.module";
import { ContactModule } from "./contact/contact.module";
import { DamageReportsModule } from "./damage/damage-reports.module";
import { MailModule } from "./mail/mail.module";
import { HealthController } from "./health/health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: jwtSecret(
          config.get<string>("JWT_SECRET"),
          config.get<string>("NODE_ENV") ?? process.env.NODE_ENV,
        ),
        signOptions: { expiresIn: "7d" },
      }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
    }),
    DatabaseModule,
    CommonModule,
    InventoryModule,
    MailModule,
    AuthModule,
    CatalogModule,
    CartModule,
    FavoritesModule,
    ReviewsModule,
    NoticesModule,
    SessionModule,
    OrdersModule,
    DesignModule,
    CommissionsModule,
    AdminModule,
    ContentModule,
    HelpModule,
    ShapeModule,
    ContactModule,
    DamageReportsModule,
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
