import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import compression from "compression";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { allowedOrigins, isAllowedOrigin } from "./common/cors-origins";
import { setupSwagger } from "./swagger";

async function bootstrap() {
  // Disable default parsers so we can raise the JSON limit for admin product images.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  // Without this, SIGTERM/SIGINT kill the process without running
  // OnModuleDestroy (InventoryService never clears its sweep timer and the
  // TypeORM pool is never closed, so an in-flight sweep transaction can be
  // abandoned on Postgres as "idle in transaction").
  app.enableShutdownHooks();
  // Number of reverse proxies in front of the API; the throttler keys on `req.ip`.
  const trustedProxies = Number(process.env.TRUST_PROXY ?? 0);
  if (trustedProxies > 0) app.set("trust proxy", trustedProxies);
  app.useBodyParser("json", { limit: "12mb" });
  app.useBodyParser("urlencoded", { limit: "12mb", extended: true });
  app.use(cookieParser());
  // Defaults verified in compression.spec.ts: skips bodies under ~1KB, skips
  // clients that send no Accept-Encoding, and never double-compresses a
  // response that already set its own Content-Encoding (e.g. if a reverse
  // proxy in front of this process already compressed it) — safe to enable
  // unconditionally rather than guessing at Liara's own config.
  app.use(compression());
  const corsOrigins = allowedOrigins();
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      callback(null, isAllowedOrigin(origin, corsOrigins));
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  setupSwagger(app);
  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, process.env.HOST || "0.0.0.0");
}

bootstrap();
