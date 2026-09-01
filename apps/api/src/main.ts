import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import cookieParser = require("cookie-parser");
import { AppModule } from "./app.module";

function isAllowedOrigin(origin?: string) {
  if (!origin) return true;
  const allowed = [
    process.env.STOREFRONT_ORIGIN,
    process.env.ADMIN_ORIGIN,
    "http://localhost:3000",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "https://rad-studio-ceramic.mahdiyeh-norozi77.chatgpt.site",
    "https://rad-studio.rad-studio.workers.dev",
    "https://rad-admin.rad-studio.workers.dev",
  ].filter(Boolean) as string[];
  if (allowed.includes(origin)) return true;
  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith(".workers.dev") || hostname.endsWith(".chatgpt.site");
  } catch {
    return false;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      callback(null, isAllowedOrigin(origin));
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
  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, "0.0.0.0");
}

bootstrap();
