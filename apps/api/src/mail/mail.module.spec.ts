import assert from "node:assert/strict";
import { after, describe, test } from "node:test";
import { InternalServerErrorException, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { INestApplicationContext } from "@nestjs/common";
import { MailModule } from "./mail.module";
import { MailService } from "./mail.service";

/**
 * Regression coverage for a production incident: `MailService`'s
 * constructor took a second, un-decorated `TransportFactory`-typed
 * parameter (a default-value injection for tests). TypeScript erases that
 * function-type alias to `Function` in the emitted `design:paramtypes`
 * metadata, so Nest's real DI container tried to resolve a `Function`
 * provider that no module registers — `UnknownDependenciesException` on
 * every boot, crash-looping the API.
 *
 * `mail.service.spec.ts` never caught this because it constructs
 * `MailService` directly with `new`, bypassing Nest's container entirely.
 * This file boots the real `MailModule` through `NestFactory`, the same
 * mechanism `main.ts` uses in production, so a DI wiring regression here
 * fails a test instead of a production boot.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
    MailModule,
  ],
})
class TestAppModule {}

describe("MailModule: boots through Nest's real DI container", () => {
  let context: INestApplicationContext;

  after(async () => {
    await context?.close();
  });

  test("resolves MailService with no SMTP env vars present (the production-failure case)", async () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    context = await NestFactory.createApplicationContext(TestAppModule, {
      logger: false,
    });
    const mail = context.get(MailService);
    assert.ok(mail instanceof MailService);
    assert.equal(mail.isConfigured(), false);
  });

  test("email-sending fails explicitly (not a crash) when SMTP config is absent", async () => {
    const mail = context.get(MailService);
    await assert.rejects(
      () => mail.sendPasswordResetCode("user@example.test", "123456"),
      InternalServerErrorException,
    );
  });
});
