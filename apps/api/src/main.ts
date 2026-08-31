import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import cookieParser = require("cookie-parser");
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const storefront = process.env.STOREFRONT_ORIGIN ?? "http://localhost:3000";
  const admin = process.env.ADMIN_ORIGIN ?? "http://localhost:3002";
  app.use(cookieParser());
  app.enableCors({
    origin: [storefront, admin, "http://localhost:3000", "http://localhost:3002", "http://127.0.0.1:3000"],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(Number(process.env.PORT) || 4000);
}

bootstrap();
