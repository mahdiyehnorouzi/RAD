import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { ConfigService } from "@nestjs/config";
import { InternalServerErrorException, Logger } from "@nestjs/common";
import { MelipayamakService } from "./melipayamak.service";

const SEND_OTP_URL = "https://rest.payamak-panel.com/api/SendSMS/SendOtp";

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

  test("blank or whitespace-only settings count as missing", () => {
    assert.equal(
      new MelipayamakService(
        configured({ MELIPAYAMAK_PASSWORD: "   " }),
      ).isConfigured(),
      false,
    );
    assert.equal(
      new MelipayamakService(
        configured({ MELIPAYAMAK_SENDER: "" }),
      ).isConfigured(),
      false,
    );
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

function providerBody(body: unknown) {
  return JSON.stringify(body);
}

describe("MelipayamakService: SendOtp response handling", () => {
  test("posts the generated code and recipient, and ignores Value", async () => {
    let captured: { url: string; init: RequestInit } | undefined;
    globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
      captured = { url: String(url), init: init ?? {} };
      return new Response(
        providerBody({
          Value: "999999",
          RetStatus: 1,
          StrRetStatus: "Ok",
        }),
        { status: 200 },
      );
    }) as typeof fetch;

    await new MelipayamakService(configured()).sendOtp("09121234567", "654321");

    assert.ok(captured);
    assert.equal(captured.url, SEND_OTP_URL);
    assert.equal(captured.init.method, "POST");
    assert.equal(
      new Headers(captured.init.headers).get("content-type"),
      "application/x-www-form-urlencoded",
    );
    assert.equal("dispatcher" in captured.init, false);
    assert.equal("agent" in captured.init, false);
    const params = new URLSearchParams(captured.init.body as URLSearchParams);
    assert.equal(params.get("username"), "rad-studio");
    assert.equal(params.get("password"), "super-secret-password");
    assert.equal(params.get("to"), "09121234567");
    assert.equal(params.get("from"), "3000123456");
    assert.equal(params.get("code"), "654321");
    assert.notEqual(params.get("code"), "999999");
  });

  test("RetStatus 1 and StrRetStatus Ok is a successful delivery", async () => {
    stubFetch(
      200,
      providerBody({ Value: "123456789", RetStatus: 1, StrRetStatus: "Ok" }),
    );
    await new MelipayamakService(configured()).sendOtp("09121234567", "654321");
  });

  test("a string RetStatus of 1 with Ok is a successful delivery", async () => {
    stubFetch(
      200,
      providerBody({ Value: "0", RetStatus: "1", StrRetStatus: "ok" }),
    );
    await new MelipayamakService(configured()).sendOtp("09121234567", "654321");
  });

  test("RetStatus other than 1 is not a successful send", async () => {
    stubFetch(
      200,
      providerBody({ Value: "654321", RetStatus: 0, StrRetStatus: "Ok" }),
    );
    await assert.rejects(
      () =>
        new MelipayamakService(configured()).sendOtp("09121234567", "654321"),
      (error: unknown) => {
        assert.ok(error instanceof InternalServerErrorException);
        const message = JSON.stringify(error.getResponse());
        assert.equal(message.includes("654321"), false);
        assert.equal(message.includes("super-secret-password"), false);
        return true;
      },
    );
  });

  test("RetStatus 1 without StrRetStatus Ok is not a successful send", async () => {
    stubFetch(
      200,
      providerBody({ Value: "123", RetStatus: 1, StrRetStatus: "InvalidData" }),
    );
    await assert.rejects(
      () =>
        new MelipayamakService(configured()).sendOtp("09121234567", "654321"),
      InternalServerErrorException,
    );
  });

  test("a plain numeric body is not treated as success", async () => {
    stubFetch(200, "123456789");
    await assert.rejects(
      () =>
        new MelipayamakService(configured()).sendOtp("09121234567", "654321"),
      InternalServerErrorException,
    );
  });

  test("a non-2xx HTTP response throws even when the JSON looks successful", async () => {
    stubFetch(
      500,
      providerBody({ Value: "1", RetStatus: 1, StrRetStatus: "Ok" }),
    );
    await assert.rejects(
      () =>
        new MelipayamakService(configured()).sendOtp("09121234567", "654321"),
      InternalServerErrorException,
    );
  });

  test("a network failure is surfaced, not swallowed", async () => {
    globalThis.fetch = (async () => {
      throw new Error("ECONNREFUSED");
    }) as typeof fetch;
    await assert.rejects(
      () =>
        new MelipayamakService(configured()).sendOtp("09121234567", "654321"),
      (error: unknown) => {
        assert.ok(error instanceof InternalServerErrorException);
        const message = JSON.stringify(error.getResponse());
        assert.equal(message.includes("super-secret-password"), false);
        assert.equal(message.includes("654321"), false);
        return true;
      },
    );
  });

  test("logs omit the OTP, credentials, recipient, and request body", async () => {
    const lines: string[] = [];
    const original = {
      error: Logger.prototype.error,
      warn: Logger.prototype.warn,
      log: Logger.prototype.log,
    };
    const record =
      (method: "error" | "warn" | "log") =>
      function (this: Logger, ...args: unknown[]) {
        lines.push(args.map((arg) => String(arg)).join(" "));
        return original[method].apply(this, args as never);
      };
    Logger.prototype.error = record("error");
    Logger.prototype.warn = record("warn");
    Logger.prototype.log = record("log");
    try {
      stubFetch(
        200,
        providerBody({
          Value: "654321",
          RetStatus: 35,
          StrRetStatus: "InvalidData",
        }),
      );
      await assert.rejects(() =>
        new MelipayamakService(configured()).sendOtp("09121234567", "654321"),
      );
      globalThis.fetch = (async () => {
        throw new Error("ECONNREFUSED password=super-secret-password");
      }) as typeof fetch;
      await assert.rejects(() =>
        new MelipayamakService(configured()).sendOtp("09121234567", "654321"),
      );
    } finally {
      Logger.prototype.error = original.error;
      Logger.prototype.warn = original.warn;
      Logger.prototype.log = original.log;
    }
    const blob = lines.join("\n");
    assert.equal(blob.includes("654321"), false);
    assert.equal(blob.includes("super-secret-password"), false);
    assert.equal(blob.includes("09121234567"), false);
    assert.equal(blob.includes("username="), false);
    assert.match(blob, /RetStatus 35/);
    assert.match(blob, /Melipayamak SendOtp request failed: Error/);
  });
});
