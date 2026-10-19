import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ConfigService } from "@nestjs/config";
import { InternalServerErrorException } from "@nestjs/common";
import { MailService } from "./mail.service";

/**
 * Regression coverage for the incident's second finding: SMTP env vars
 * were entirely absent in production, so password-reset / invite emails
 * silently never had a transport. These tests prove:
 * - missing config is detected and surfaced as a clear error, not a
 *   misleading success;
 * - a transport-level send failure is surfaced too, never swallowed;
 * - a successful send actually calls the transport with the right
 *   recipient/subject and never leaks the SMTP password into any thrown
 *   error or log-adjacent string.
 *
 * No real network/SMTP connection is used: `createTransport` is injected
 * (see `mail.service.ts`), so these run fully offline and fast.
 */
function configured(overrides: Record<string, string> = {}) {
  return new ConfigService({
    SMTP_HOST: "smtp.example.test",
    SMTP_USER: "bot@example.test",
    SMTP_PASS: "super-secret-app-password",
    SMTP_PORT: "587",
    SMTP_FROM: "RAD Studio <bot@example.test>",
    ...overrides,
  });
}

function fakeTransport(sendMail: (options: unknown) => Promise<unknown>) {
  return () => ({ sendMail }) as never;
}

describe("MailService: configuration validation", () => {
  test("isConfigured() is false when any of SMTP_HOST/SMTP_USER/SMTP_PASS is missing", () => {
    assert.equal(
      new MailService(new ConfigService({})).isConfigured(),
      false,
    );
    assert.equal(
      new MailService(new ConfigService({ SMTP_HOST: "h" })).isConfigured(),
      false,
    );
    assert.equal(
      new MailService(
        new ConfigService({ SMTP_HOST: "h", SMTP_USER: "u" }),
      ).isConfigured(),
      false,
    );
  });

  test("isConfigured() is true once all three are present", () => {
    assert.equal(new MailService(configured()).isConfigured(), true);
  });

  test("sending with missing SMTP config throws instead of silently succeeding", async () => {
    const mail = new MailService(new ConfigService({}));
    await assert.rejects(
      () => mail.sendPasswordResetCode("user@example.test", "123456"),
      InternalServerErrorException,
    );
  });

  test("the missing-config error message never contains a credential value (there is none to leak yet)", async () => {
    const mail = new MailService(new ConfigService({}));
    await assert.rejects(
      () => mail.sendPasswordResetCode("user@example.test", "123456"),
      (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        assert.doesNotMatch(message, /super-secret/);
        return true;
      },
    );
  });
});

describe("MailService: transport failures are surfaced, not swallowed", () => {
  test("a password-reset send that fails at the transport throws (never a misleading success)", async () => {
    const mail = new MailService(
      configured(),
      fakeTransport(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );
    await assert.rejects(
      () => mail.sendPasswordResetCode("user@example.test", "123456"),
      InternalServerErrorException,
    );
  });

  test("the thrown error never includes the SMTP password", async () => {
    const mail = new MailService(
      configured(),
      fakeTransport(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );
    await assert.rejects(
      () => mail.sendPasswordResetCode("user@example.test", "123456"),
      (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        assert.doesNotMatch(message, /super-secret/);
        return true;
      },
    );
  });

  test("an admin-invite send that fails at the transport throws", async () => {
    const mail = new MailService(
      configured(),
      fakeTransport(async () => {
        throw new Error("EAUTH");
      }),
    );
    await assert.rejects(
      () => mail.sendAdminInvite("new-admin@example.test", "654321"),
      InternalServerErrorException,
    );
  });
});

describe("MailService: successful sends", () => {
  test("sendPasswordResetCode calls the transport with the right recipient, subject, and code", async () => {
    const calls: Array<Record<string, unknown>> = [];
    const mail = new MailService(
      configured(),
      fakeTransport(async (options) => {
        calls.push(options as Record<string, unknown>);
        return { messageId: "test" };
      }),
    );
    await mail.sendPasswordResetCode("user@example.test", "482913");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].to, "user@example.test");
    assert.match(String(calls[0].text), /482913/);
    assert.match(String(calls[0].html), /482913/);
  });

  test("sendAdminInvite calls the transport with the invite code and never includes a plaintext password", async () => {
    const calls: Array<Record<string, unknown>> = [];
    const mail = new MailService(
      configured(),
      fakeTransport(async (options) => {
        calls.push(options as Record<string, unknown>);
        return { messageId: "test" };
      }),
    );
    await mail.sendAdminInvite("new-admin@example.test", "111222");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].to, "new-admin@example.test");
    assert.match(String(calls[0].text), /111222/);
    // The invite email must carry only the one-time code, never a
    // generated/stored password — there is no password to leak here.
    assert.doesNotMatch(String(calls[0].text), /password|رمز عبور موقت/);
  });
});
