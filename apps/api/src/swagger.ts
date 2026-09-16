import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AUTH_COOKIE } from "./common/cookies";
import { APP_VERSION } from "./version";

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("RAD API")
    .setDescription("Storefront, workshop, and admin HTTP API for RAD Studio.")
    .setVersion(process.env.RAD_VERSION ?? APP_VERSION)
    .addCookieAuth(AUTH_COOKIE, {
      type: "apiKey",
      in: "cookie",
      name: AUTH_COOKIE,
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup("docs", app, document, {
    customSiteTitle: "RAD API Docs",
    swaggerOptions: {
      persistAuthorization: true,
      withCredentials: true,
      tryItOutEnabled: true,
      defaultModelsExpandDepth: 2,
    },
  });
}
