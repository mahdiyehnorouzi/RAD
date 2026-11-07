import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { ConfigService } from "@nestjs/config";
import { InternalServerErrorException, Logger } from "@nestjs/common";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { MelipayamakService } from "./melipayamak.service";

process.env.RAD_DISABLE_SMS_TRACE = "1";

function configured(overrides: Record<string, string> = {}) {
  return new ConfigService({
    MELIPAYAMAK_USERNAME: "rad-user",
    MELIPAYAMAK_PASSWORD: "rad-pass",
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

describe("MelipayamakService: configuration validation", () => {
  test("isConfigured() is false when any var is missing", () => {
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
    assert.equal(
      new MelipayamakService(
        new ConfigService({
          MELIPAYAMAK_USERNAME: "u",
          MELIPAYAMAK_PASSWORD: "p",
        }),
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

  test("the missing-config error never leaks the configured credentials (there are none to leak yet)", async () => {
    const sms = new MelipayamakService(new ConfigService({}));
    await assert.rejects(
      () => sms.sendOtp("09121234567", "123456"),
      (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        assert.doesNotMatch(message, /rad-user|rad-pass/);
        return true;
      },
    );
  });
});

describe("MelipayamakService: request shape", () => {
  test("posts form-urlencoded (not JSON) with username/password/to/from/code", async () => {
    let capturedUrl = "";
    let capturedBody = "";
    let capturedContentType = "";
    stubFetch(async (url, init) => {
      capturedUrl = url;
      capturedBody = String(init.body);
      capturedContentType = String(
        (init.headers as Record<string, string>)?.["content-type"],
      );
      return new Response("987654321", { status: 200 });
    });

    await new MelipayamakService(configured()).sendOtp("09121234567", "482917");

    assert.equal(
      capturedUrl,
      "https://rest.payamak-panel.com/api/SendSMS/SendOtp",
    );
    assert.equal(capturedContentType, "application/x-www-form-urlencoded");
    const params = new URLSearchParams(capturedBody);
    assert.equal(params.get("username"), "rad-user");
    assert.equal(params.get("password"), "rad-pass");
    assert.equal(params.get("from"), "3000123456");
    assert.equal(params.get("to"), "09121234567");
    assert.equal(params.get("code"), "482917");
  });

  test("`to` is always the caller's argument, never a fixed/env value", async () => {
    let capturedTo = "";
    stubFetch(async (_url, init) => {
      capturedTo = new URLSearchParams(String(init.body)).get("to") ?? "";
      return new Response("1", { status: 200 });
    });
    await new MelipayamakService(configured()).sendOtp("09129998877", "111111");
    assert.equal(capturedTo, "09129998877");
  });

  test("`code` is always the caller's argument, never a fixed/env value", async () => {
    let capturedCode = "";
    stubFetch(async (_url, init) => {
      capturedCode = new URLSearchParams(String(init.body)).get("code") ?? "";
      return new Response("1", { status: 200 });
    });
    await new MelipayamakService(configured()).sendOtp("09121234567", "753951");
    assert.equal(capturedCode, "753951");
  });
});

describe("MelipayamakService: response handling", () => {
  test("a 2xx response with a positive numeric recId is a success", async () => {
    stubFetch(async () => new Response("13579", { status: 200 }));
    await new MelipayamakService(configured()).sendOtp("09121234567", "123456");
  });

  test("a recId wrapped in the documented XML <string> shape is still a success", async () => {
    stubFetch(
      async () =>
        new Response(
          '<?xml version="1.0" encoding="utf-8"?><string xmlns="http://tempuri.org/">24681</string>',
          { status: 200, headers: { "content-type": "text/xml" } },
        ),
    );
    await new MelipayamakService(configured()).sendOtp("09121234567", "123456");
  });

  for (const code of [
    "0", // wrong username or password
    "2", // insufficient credit
    "5", // sender number invalid
    "16", // recipient not found
    "18", // recipient number invalid
    "35", // blacklisted
    "111", // requester invalid
  ]) {
    test(`a documented error return value ("${code}") is rejected, never mistaken for a recId`, async () => {
      stubFetch(async () => new Response(code, { status: 200 }));
      await assert.rejects(
        () =>
          new MelipayamakService(configured()).sendOtp("09121234567", "123456"),
        (error: unknown) => {
          assert.ok(error instanceof InternalServerErrorException);
          assert.equal(
            (error.getResponse() as { code?: string }).code,
            undefined, // the public error is generic, not the provider's own code
          );
          return true;
        },
      );
    });
  }

  for (const code of ["-108", "-109", "-110"]) {
    test(`a documented negative error code ("${code}") is rejected`, async () => {
      stubFetch(async () => new Response(code, { status: 200 }));
      await assert.rejects(
        () =>
          new MelipayamakService(configured()).sendOtp("09121234567", "123456"),
        InternalServerErrorException,
      );
    });
  }

  test("an unrecognized, non-numeric body is rejected rather than assumed successful", async () => {
    stubFetch(async () => new Response("unexpected garbage", { status: 200 }));
    await assert.rejects(
      () =>
        new MelipayamakService(configured()).sendOtp("09121234567", "123456"),
      InternalServerErrorException,
    );
  });

  test("an empty body is rejected rather than assumed successful", async () => {
    stubFetch(async () => new Response("", { status: 200 }));
    await assert.rejects(
      () =>
        new MelipayamakService(configured()).sendOtp("09121234567", "123456"),
      InternalServerErrorException,
    );
  });

  test("a non-2xx HTTP response throws even with a plausible-looking body", async () => {
    stubFetch(async () => new Response("13579", { status: 500 }));
    await assert.rejects(
      () =>
        new MelipayamakService(configured()).sendOtp("09121234567", "123456"),
      InternalServerErrorException,
    );
  });

  test("a network failure is surfaced, not swallowed", async () => {
    globalThis.fetch = (async () => {
      throw new Error("ECONNREFUSED");
    }) as typeof fetch;
    await assert.rejects(
      () =>
        new MelipayamakService(configured()).sendOtp("09121234567", "123456"),
      InternalServerErrorException,
    );
  });

  test("a request that times out is surfaced as a coded 500, not left hanging", async () => {
    stubFetch(async () => {
      throw new DOMException("The operation was aborted.", "TimeoutError");
    });
    await assert.rejects(
      () =>
        new MelipayamakService(configured()).sendOtp("09121234567", "123456"),
      InternalServerErrorException,
    );
  });
});

describe("MelipayamakService: REST JSON response shape", () => {
  test("a JSON body with a numeric-string Value is a success (the real REST wrapper shape)", async () => {
    stubFetch(
      async () =>
        new Response(JSON.stringify({ Value: "246813579" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    await new MelipayamakService(configured()).sendOtp("09121234567", "123456");
  });

  test("a JSON body with a numeric (not string) Value is a success", async () => {
    stubFetch(
      async () =>
        new Response(JSON.stringify({ Value: 246813579 }), { status: 200 }),
    );
    await new MelipayamakService(configured()).sendOtp("09121234567", "123456");
  });

  test("a lowercase `value` key is also recognized (case-insensitive field match)", async () => {
    stubFetch(
      async () =>
        new Response(JSON.stringify({ value: "13579" }), { status: 200 }),
    );
    await new MelipayamakService(configured()).sendOtp("09121234567", "123456");
  });

  test("other fields alongside Value (e.g. a status flag) don't change the classification", async () => {
    stubFetch(
      async () =>
        new Response(
          JSON.stringify({
            Value: "13579",
            RetStatus: 1,
            StrRetStatus: "Success",
          }),
          { status: 200 },
        ),
    );
    await new MelipayamakService(configured()).sendOtp("09121234567", "123456");
  });

  for (const code of ["0", "2", "16", "18", "35", "111", "-110"]) {
    test(`a JSON Value holding a documented error code ("${code}") is rejected, never mistaken for a recId`, async () => {
      stubFetch(
        async () =>
          new Response(JSON.stringify({ Value: code }), { status: 200 }),
      );
      await assert.rejects(
        () =>
          new MelipayamakService(configured()).sendOtp("09121234567", "123456"),
        InternalServerErrorException,
      );
    });
  }

  test("a JSON body with no Value field is rejected rather than assumed successful", async () => {
    stubFetch(
      async () =>
        new Response(JSON.stringify({ RetStatus: 1 }), { status: 200 }),
    );
    await assert.rejects(
      () =>
        new MelipayamakService(configured()).sendOtp("09121234567", "123456"),
      InternalServerErrorException,
    );
  });

  test("a Value that is neither a string nor a number is rejected", async () => {
    stubFetch(
      async () =>
        new Response(JSON.stringify({ Value: { recId: 1 } }), { status: 200 }),
    );
    await assert.rejects(
      () =>
        new MelipayamakService(configured()).sendOtp("09121234567", "123456"),
      InternalServerErrorException,
    );
  });

  test("malformed JSON (truncated/invalid syntax) is rejected rather than crashing", async () => {
    stubFetch(async () => new Response('{"Value": "13579"', { status: 200 }));
    await assert.rejects(
      () =>
        new MelipayamakService(configured()).sendOtp("09121234567", "123456"),
      InternalServerErrorException,
    );
  });

  test("a JSON array body (not an object) is rejected rather than crashing", async () => {
    stubFetch(
      async () => new Response(JSON.stringify(["13579"]), { status: 200 }),
    );
    await assert.rejects(
      () =>
        new MelipayamakService(configured()).sendOtp("09121234567", "123456"),
      InternalServerErrorException,
    );
  });

  test("the plain-text and XML response shapes still work alongside the JSON one", async () => {
    stubFetch(async () => new Response("13579", { status: 200 }));
    await new MelipayamakService(configured()).sendOtp("09121234567", "123456");

    stubFetch(
      async () =>
        new Response(
          '<?xml version="1.0" encoding="utf-8"?><string xmlns="http://tempuri.org/">24681</string>',
          { status: 200 },
        ),
    );
    await new MelipayamakService(configured()).sendOtp("09121234567", "123456");
  });
});

describe("MelipayamakService: failure logging", () => {
  test("the failure message never includes the OTP code or phone number", async () => {
    stubFetch(async () => new Response("0", { status: 200 }));
    await assert.rejects(
      () =>
        new MelipayamakService(configured()).sendOtp("09121234567", "999999"),
      (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        assert.doesNotMatch(message, /999999/);
        assert.doesNotMatch(message, /09121234567/);
        return true;
      },
    );
  });
});

describe("MelipayamakService: RetStatus delivery status", () => {
  test("RetStatus 1 and StrRetStatus Ok succeeds and still sends the generated code", async () => {
    let capturedCode = "";
    stubFetch(async (_url, init) => {
      capturedCode = new URLSearchParams(String(init.body)).get("code") ?? "";
      return new Response(
        JSON.stringify({
          Value: "999999",
          RetStatus: 1,
          StrRetStatus: "Ok",
        }),
        { status: 200 },
      );
    });
    await new MelipayamakService(configured()).sendOtp("09121234567", "654321");
    assert.equal(capturedCode, "654321");
    assert.notEqual(capturedCode, "999999");
  });

  test("Value is not the OTP: RetStatus 1 and Ok succeeds even when Value is an error code", async () => {
    stubFetch(
      async () =>
        new Response(
          JSON.stringify({ Value: "0", RetStatus: "1", StrRetStatus: "ok" }),
          { status: 200 },
        ),
    );
    await new MelipayamakService(configured()).sendOtp("09121234567", "654321");
  });

  test("RetStatus other than 1 is not a successful send, even with a recId Value", async () => {
    stubFetch(
      async () =>
        new Response(
          JSON.stringify({
            Value: "654321",
            RetStatus: 0,
            StrRetStatus: "Ok",
          }),
          { status: 200 },
        ),
    );
    await assert.rejects(
      () =>
        new MelipayamakService(configured()).sendOtp("09121234567", "654321"),
      InternalServerErrorException,
    );
  });

  test("RetStatus 1 without StrRetStatus Ok is not a successful send", async () => {
    stubFetch(
      async () =>
        new Response(
          JSON.stringify({
            Value: "13579",
            RetStatus: 1,
            StrRetStatus: "InvalidData",
          }),
          { status: 200 },
        ),
    );
    await assert.rejects(
      () =>
        new MelipayamakService(configured()).sendOtp("09121234567", "654321"),
      InternalServerErrorException,
    );
  });

  test("logs omit the OTP, credentials, recipient, and request body", async () => {
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
    try {
      stubFetch(
        async () =>
          new Response(
            JSON.stringify({
              Value: "654321",
              RetStatus: 35,
              StrRetStatus: "InvalidData",
            }),
            { status: 200 },
          ),
      );
      await assert.rejects(() =>
        new MelipayamakService(configured()).sendOtp("09121234567", "654321"),
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
    }
    const blob = lines.join("\n");
    assert.equal(blob.includes("654321"), false);
    assert.equal(blob.includes("rad-pass"), false);
    assert.equal(blob.includes("09121234567"), false);
    assert.equal(blob.includes("username="), false);
    assert.match(blob, /RetStatus 35/);
    assert.match(blob, /Melipayamak SendOtp request failed: Error/);
  });
});

describe("MelipayamakService: SMS trace file", () => {
  test("writes a replayable curl and the full provider response", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "rad-sms-trace-"));
    const file = path.join(dir, "sms-send.log");
    const previousDisable = process.env.RAD_DISABLE_SMS_TRACE;
    const previousFile = process.env.SMS_TRACE_FILE;
    process.env.RAD_DISABLE_SMS_TRACE = "0";
    process.env.SMS_TRACE_FILE = file;
    try {
      stubFetch(
        async () =>
          new Response(
            JSON.stringify({
              Value: "999999",
              RetStatus: 0,
              StrRetStatus: "InvalidData",
            }),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            },
          ),
      );
      await assert.rejects(() =>
        new MelipayamakService(configured()).sendOtp("09121234567", "654321"),
      );
      const trace = readFileSync(file, "utf8");
      assert.match(
        trace,
        /curl -sS -X POST 'https:\/\/rest\.payamak-panel\.com\/api\/SendSMS\/SendOtp'/,
      );
      assert.match(trace, /--data-urlencode 'username=rad-user'/);
      assert.match(trace, /--data-urlencode 'password=rad-pass'/);
      assert.match(trace, /--data-urlencode 'to=09121234567'/);
      assert.match(trace, /--data-urlencode 'from=3000123456'/);
      assert.match(trace, /--data-urlencode 'code=654321'/);
      assert.match(trace, /HTTP 200/);
      assert.match(trace, /content-type: application\/json/);
      assert.match(trace, /"RetStatus":0/);
      assert.match(trace, /"Value":"999999"/);
    } finally {
      if (previousDisable === undefined)
        delete process.env.RAD_DISABLE_SMS_TRACE;
      else process.env.RAD_DISABLE_SMS_TRACE = previousDisable;
      if (previousFile === undefined) delete process.env.SMS_TRACE_FILE;
      else process.env.SMS_TRACE_FILE = previousFile;
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
