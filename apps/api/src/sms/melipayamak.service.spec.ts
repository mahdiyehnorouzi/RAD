import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { ConfigService } from "@nestjs/config";
import { InternalServerErrorException, Logger } from "@nestjs/common";
import { MelipayamakService } from "./melipayamak.service";

process.env.RAD_DISABLE_SMS_TRACE = "1";

const BASE_SERVICE_NUMBER_URL =
  "https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber";

function configured(overrides: Record<string, string> = {}) {
  return new ConfigService({
    MELIPAYAMAK_USERNAME: "rad-user",
    MELIPAYAMAK_PASSWORD: "rad-pass",
    MELIPAYAMAK_BASE_SERVICE_BODY_ID: "102030",
    MELIPAYAMAK_SENDER: "3000123456",
    ...overrides,
  });
}

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function stubFetch(
  handler: (url: string, init: RequestInit) => Response | Promise<Response>,
) {
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) =>
    handler(String(url), init ?? {})) as typeof fetch;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("MelipayamakService: configuration validation", () => {
  test("isConfigured() is false when username, password, or template id is missing", () => {
    assert.equal(
      new MelipayamakService(new ConfigService({})).isConfigured(),
      false,
    );
    assert.equal(
      new MelipayamakService(
        new ConfigService({
          MELIPAYAMAK_USERNAME: "u",
          MELIPAYAMAK_PASSWORD: "p",
        }),
      ).isConfigured(),
      false,
    );
    assert.equal(
      new MelipayamakService(
        configured({ MELIPAYAMAK_SENDER: "" }),
      ).isConfigured(),
      true,
    );
  });

  test("a blank, zero, or non-numeric template id is not configured", () => {
    for (const bodyId of ["", "   ", "0", "12a", "-5"]) {
      assert.equal(
        new MelipayamakService(
          configured({ MELIPAYAMAK_BASE_SERVICE_BODY_ID: bodyId }),
        ).isConfigured(),
        false,
      );
    }
  });

  test("missing credentials throw melipayamak_not_configured", async () => {
    const sms = new MelipayamakService(new ConfigService({}));
    await assert.rejects(
      () => sms.sendOtp("09121234567", "123456"),
      (error: unknown) => {
        assert.ok(error instanceof InternalServerErrorException);
        assert.equal(
          (error.getResponse() as { code?: string }).code,
          "melipayamak_not_configured",
        );
        const message = JSON.stringify(error.getResponse());
        assert.equal(message.includes("rad-pass"), false);
        return true;
      },
    );
  });

  test("a missing or invalid template id throws melipayamak_template_not_configured", async () => {
    for (const bodyId of ["", "0", "not-a-template"]) {
      const sms = new MelipayamakService(
        configured({ MELIPAYAMAK_BASE_SERVICE_BODY_ID: bodyId }),
      );
      await assert.rejects(
        () => sms.sendOtp("09121234567", "123456"),
        (error: unknown) => {
          assert.ok(error instanceof InternalServerErrorException);
          assert.equal(
            (error.getResponse() as { code?: string }).code,
            "melipayamak_template_not_configured",
          );
          const message = JSON.stringify(error.getResponse());
          assert.equal(message.includes("rad-pass"), false);
          assert.equal(message.includes("123456"), false);
          return true;
        },
      );
    }
  });
});

describe("MelipayamakService: BaseServiceNumber request", () => {
  test("posts the OTP as the only template variable and does not send the sender line", async () => {
    let capturedUrl = "";
    let capturedBody = "";
    let capturedContentType = "";
    stubFetch(async (url, init) => {
      capturedUrl = url;
      capturedBody = String(init.body);
      capturedContentType = String(
        (init.headers as Record<string, string>)?.["content-type"],
      );
      return jsonResponse({
        Value: "246813579",
        RetStatus: 1,
        StrRetStatus: "OK",
      });
    });

    await new MelipayamakService(configured()).sendOtp("09121234567", "482917");

    assert.equal(capturedUrl, BASE_SERVICE_NUMBER_URL);
    assert.equal(capturedContentType, "application/x-www-form-urlencoded");
    const params = new URLSearchParams(capturedBody);
    assert.equal(params.get("username"), "rad-user");
    assert.equal(params.get("password"), "rad-pass");
    assert.equal(params.get("to"), "09121234567");
    assert.equal(params.get("bodyId"), "102030");
    assert.equal(params.get("text"), "482917");
    assert.equal(params.get("text")?.includes(";"), false);
    assert.equal(params.get("from"), null);
    assert.equal(params.get("code"), null);
  });
});

describe("MelipayamakService: BaseServiceNumber response", () => {
  test("RetStatus 1 and StrRetStatus OK is success and Value is not the OTP", async () => {
    stubFetch(async () =>
      jsonResponse({
        Value: "246813579",
        RetStatus: 1,
        StrRetStatus: "OK",
      }),
    );
    await new MelipayamakService(configured()).sendOtp("09121234567", "654321");
  });

  test("a 2xx provider rejection is not a successful send", async () => {
    stubFetch(async () =>
      jsonResponse({
        Value: "0",
        RetStatus: 35,
        StrRetStatus: "BlackList",
      }),
    );
    await assert.rejects(
      () =>
        new MelipayamakService(configured()).sendOtp("09121234567", "654321"),
      (error: unknown) => {
        assert.ok(error instanceof InternalServerErrorException);
        const message = JSON.stringify(error.getResponse());
        assert.equal(message.includes("rad-pass"), false);
        assert.equal(message.includes("654321"), false);
        assert.equal(message.includes("09121234567"), false);
        return true;
      },
    );
  });

  test("StrRetStatus must be exactly OK", async () => {
    stubFetch(async () =>
      jsonResponse({
        Value: "246813579",
        RetStatus: 1,
        StrRetStatus: "Ok",
      }),
    );
    await assert.rejects(
      () =>
        new MelipayamakService(configured()).sendOtp("09121234567", "654321"),
      InternalServerErrorException,
    );
  });

  test("a malformed body is not a successful send", async () => {
    for (const body of ["not-json", "", "[]", '{"Value":"246813579"}']) {
      stubFetch(async () => new Response(body, { status: 200 }));
      await assert.rejects(
        () =>
          new MelipayamakService(configured()).sendOtp("09121234567", "654321"),
        InternalServerErrorException,
      );
    }
  });

  test("a non-2xx response is not success even when the JSON looks accepted", async () => {
    stubFetch(async () =>
      jsonResponse(
        { Value: "246813579", RetStatus: 1, StrRetStatus: "OK" },
        500,
      ),
    );
    await assert.rejects(
      () =>
        new MelipayamakService(configured()).sendOtp("09121234567", "654321"),
      InternalServerErrorException,
    );
  });

  test("a network failure is surfaced, not swallowed", async () => {
    stubFetch(async () => {
      throw new Error("ECONNREFUSED");
    });
    await assert.rejects(
      () =>
        new MelipayamakService(configured()).sendOtp("09121234567", "654321"),
      InternalServerErrorException,
    );
  });

  test("logs and the trace file omit credentials, the OTP, and the full phone number", async () => {
    const lines: string[] = [];
    const original = {
      error: Logger.prototype.error,
      warn: Logger.prototype.warn,
      log: Logger.prototype.log,
    };
    const record = (method: "error" | "warn" | "log") =>
      function (this: Logger, ...args: unknown[]) {
        lines.push(args.map((arg) => String(arg)).join(" "));
        return original[method].apply(this, args as never);
      };
    Logger.prototype.error = record("error");
    Logger.prototype.warn = record("warn");
    Logger.prototype.log = record("log");
    const dir = mkdtempSync(path.join(tmpdir(), "rad-sms-trace-"));
    const file = path.join(dir, "sms-send.log");
    const previousDisable = process.env.RAD_DISABLE_SMS_TRACE;
    const previousFile = process.env.SMS_TRACE_FILE;
    process.env.RAD_DISABLE_SMS_TRACE = "0";
    process.env.SMS_TRACE_FILE = file;
    try {
      stubFetch(async () =>
        jsonResponse({
          Value: "246813579",
          RetStatus: 1,
          StrRetStatus: "OK",
        }),
      );
      await new MelipayamakService(configured()).sendOtp(
        "09121234567",
        "654321",
      );
      stubFetch(async () => {
        throw new Error("ECONNREFUSED password=rad-pass");
      });
      await assert.rejects(() =>
        new MelipayamakService(configured()).sendOtp("09121234567", "654321"),
      );
    } finally {
      Logger.prototype.error = original.error;
      Logger.prototype.warn = original.warn;
      Logger.prototype.log = original.log;
      if (previousDisable === undefined)
        delete process.env.RAD_DISABLE_SMS_TRACE;
      else process.env.RAD_DISABLE_SMS_TRACE = previousDisable;
      if (previousFile === undefined) delete process.env.SMS_TRACE_FILE;
      else process.env.SMS_TRACE_FILE = previousFile;
      const trace = readFileSync(file, "utf8");
      rmSync(dir, { recursive: true, force: true });
      const blob = `${lines.join("\n")}\n${trace}`;
      assert.match(trace, /receipt 246813579/);
      assert.match(lines.join("\n"), /receipt 246813579/);
      for (const secret of ["rad-pass", "654321", "09121234567", "username="]) {
        assert.equal(blob.includes(secret), false, secret);
      }
    }
  });
});
