import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { ConfigService } from "@nestjs/config";
import { InternalServerErrorException } from "@nestjs/common";
import { MelipayamakService } from "./melipayamak.service";

function configured(overrides: Record<string, string> = {}) {
  return new ConfigService({
    MELIPAYAMAK_USERNAME: "rad-studio",
    MELIPAYAMAK_PASSWORD: "super-secret-password",
    MELIPAYAMAK_SENDER: "3000123456",
    ...overrides,
  });
}

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function stubFetch(status: number, body: string) {
  globalThis.fetch = (async () =>
    new Response(body, { status })) as typeof fetch;
}

describe("MelipayamakService: configuration validation", () => {
  test("isConfigured() is false when any of USERNAME/PASSWORD/SENDER is missing", () => {
    assert.equal(
      new MelipayamakService(new ConfigService({})).isConfigured(),
      false,
    );
    assert.equal(
      new MelipayamakService(
        new ConfigService({ MELIPAYAMAK_USERNAME: "u" }),
      ).isConfigured(),
      false,
    );
  });

  test("isConfigured() is true once all three are present", () => {
    assert.equal(new MelipayamakService(configured()).isConfigured(), true);
  });

  test("sending with missing config throws a coded error instead of silently succeeding", async () => {
    const sms = new MelipayamakService(new ConfigService({}));
    await assert.rejects(
      () => sms.sendOtp("09121234567", "123456"),
      (error: unknown) => {
        assert.ok(error instanceof InternalServerErrorException);
        assert.equal(
          (error.getResponse() as { code?: string }).code,
          "melipayamak_not_configured",
        );
        return true;
      },
    );
  });

  test("the missing-config error never leaks the configured password (there is none to leak yet)", async () => {
    const sms = new MelipayamakService(new ConfigService({}));
    await assert.rejects(
      () => sms.sendOtp("09121234567", "123456"),
      (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        assert.doesNotMatch(message, /super-secret/);
        return true;
      },
    );
  });
});

describe("MelipayamakService: SendOtp response handling", () => {
  test("a numeric ReturnValue (recId) is a success", async () => {
    stubFetch(200, "123456789");
    await new MelipayamakService(configured()).sendOtp("09121234567", "654321");
  });

  test("ReturnValue '0' (bad credentials) throws", async () => {
    stubFetch(200, "0");
    await assert.rejects(
      () => new MelipayamakService(configured()).sendOtp("09121234567", "654321"),
      InternalServerErrorException,
    );
  });

  test("a negative ReturnValue (e.g. '-111' invalid IP) throws", async () => {
    stubFetch(200, "-111");
    await assert.rejects(
      () => new MelipayamakService(configured()).sendOtp("09121234567", "654321"),
      InternalServerErrorException,
    );
  });

  test("a non-2xx HTTP response throws even with a numeric-looking body", async () => {
    stubFetch(500, "123456789");
    await assert.rejects(
      () => new MelipayamakService(configured()).sendOtp("09121234567", "654321"),
      InternalServerErrorException,
    );
  });

  test("a network failure is surfaced, not swallowed", async () => {
    globalThis.fetch = (async () => {
      throw new Error("ECONNREFUSED");
    }) as typeof fetch;
    await assert.rejects(
      () => new MelipayamakService(configured()).sendOtp("09121234567", "654321"),
      InternalServerErrorException,
    );
  });
});
