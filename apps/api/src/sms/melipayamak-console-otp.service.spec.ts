import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { ConfigService } from "@nestjs/config";
import { InternalServerErrorException } from "@nestjs/common";
import { MelipayamakConsoleOtpService } from "./melipayamak-console-otp.service";

function configured(overrides: Record<string, string> = {}) {
  return new ConfigService({
    MELIPAYAMAK_CONSOLE_API_TOKEN: "console-token-123",
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

describe("MelipayamakConsoleOtpService: configuration validation", () => {
  test("isConfigured() is false with no token", () => {
    assert.equal(
      new MelipayamakConsoleOtpService(new ConfigService({})).isConfigured(),
      false,
    );
  });

  test("isConfigured() is true once the token is present", () => {
    assert.equal(
      new MelipayamakConsoleOtpService(configured()).isConfigured(),
      true,
    );
  });

  test("sending with missing config throws a coded error instead of silently succeeding", async () => {
    const sms = new MelipayamakConsoleOtpService(new ConfigService({}));
    await assert.rejects(
      () => sms.sendOtp("09121234567"),
      (error: unknown) => {
        assert.ok(error instanceof InternalServerErrorException);
        assert.equal(
          (error.getResponse() as { code?: string }).code,
          "melipayamak_console_not_configured",
        );
        return true;
      },
    );
  });

  test("the missing-config error never leaks the configured token (there is none to leak yet)", async () => {
    const sms = new MelipayamakConsoleOtpService(new ConfigService({}));
    await assert.rejects(
      () => sms.sendOtp("09121234567"),
      (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        assert.doesNotMatch(message, /console-token/);
        return true;
      },
    );
  });
});

describe("MelipayamakConsoleOtpService: request shape", () => {
  test("posts JSON with just `to` and the token in the URL path", async () => {
    let capturedUrl = "";
    let capturedBody: unknown;
    let capturedContentType = "";
    stubFetch(async (url, init) => {
      capturedUrl = url;
      capturedBody = JSON.parse(String(init.body));
      capturedContentType = String(
        (init.headers as Record<string, string>)?.["content-type"],
      );
      return new Response(JSON.stringify({ code: "1234", status: "ok" }), {
        status: 200,
      });
    });

    await new MelipayamakConsoleOtpService(configured()).sendOtp(
      "09121234567",
    );

    assert.equal(
      capturedUrl,
      "https://console.melipayamak.com/api/send/otp/console-token-123",
    );
    assert.deepEqual(capturedBody, { to: "09121234567" });
    assert.equal(capturedContentType, "application/json");
  });
});

describe("MelipayamakConsoleOtpService: response handling", () => {
  test("a 2xx response with a code is a success and returns that exact code", async () => {
    stubFetch(
      async () =>
        new Response(JSON.stringify({ code: "4821", status: "ok" }), {
          status: 200,
        }),
    );
    const code = await new MelipayamakConsoleOtpService(
      configured(),
    ).sendOtp("09121234567");
    assert.equal(code, "4821");
  });

  test("a code with a leading zero is preserved verbatim, never parsed as a number", async () => {
    stubFetch(
      async () =>
        new Response(JSON.stringify({ code: "0812", status: "ok" }), {
          status: 200,
        }),
    );
    const code = await new MelipayamakConsoleOtpService(
      configured(),
    ).sendOtp("09121234567");
    assert.equal(code, "0812");
  });

  test("a response with no `status` field at all is still treated as a success (status presence, not absence, drives failure)", async () => {
    stubFetch(
      async () => new Response(JSON.stringify({ code: "5566" }), { status: 200 }),
    );
    const code = await new MelipayamakConsoleOtpService(
      configured(),
    ).sendOtp("09121234567");
    assert.equal(code, "5566");
  });

  test("an explicit failure-looking status is never silently treated as success", async () => {
    stubFetch(
      async () =>
        new Response(JSON.stringify({ code: "1111", status: "error" }), {
          status: 200,
        }),
    );
    await assert.rejects(
      () =>
        new MelipayamakConsoleOtpService(configured()).sendOtp("09121234567"),
      InternalServerErrorException,
    );
  });

  test("a falsy status (false/0/null) is never silently treated as success", async () => {
    for (const status of [false, 0, null]) {
      stubFetch(
        async () =>
          new Response(JSON.stringify({ code: "1111", status }), {
            status: 200,
          }),
      );
      await assert.rejects(
        () =>
          new MelipayamakConsoleOtpService(configured()).sendOtp(
            "09121234567",
          ),
        InternalServerErrorException,
      );
    }
  });

  test("a 2xx response with no recognizable code throws", async () => {
    stubFetch(
      async () =>
        new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
    );
    await assert.rejects(
      () =>
        new MelipayamakConsoleOtpService(configured()).sendOtp(
          "09121234567",
        ),
      InternalServerErrorException,
    );
  });

  test("a non-digit code throws rather than being used as an OTP", async () => {
    stubFetch(
      async () =>
        new Response(JSON.stringify({ code: "ab12", status: "ok" }), {
          status: 200,
        }),
    );
    await assert.rejects(
      () =>
        new MelipayamakConsoleOtpService(configured()).sendOtp(
          "09121234567",
        ),
      InternalServerErrorException,
    );
  });

  test("a 2xx response with a non-JSON body throws rather than assuming success", async () => {
    stubFetch(async () => new Response("not json", { status: 200 }));
    await assert.rejects(
      () =>
        new MelipayamakConsoleOtpService(configured()).sendOtp(
          "09121234567",
        ),
      InternalServerErrorException,
    );
  });

  test("a non-2xx HTTP response throws even with a plausible-looking body", async () => {
    stubFetch(
      async () =>
        new Response(JSON.stringify({ code: "1111", status: "ok" }), {
          status: 500,
        }),
    );
    await assert.rejects(
      () =>
        new MelipayamakConsoleOtpService(configured()).sendOtp(
          "09121234567",
        ),
      InternalServerErrorException,
    );
  });

  test("a network failure is surfaced, not swallowed", async () => {
    globalThis.fetch = (async () => {
      throw new Error("ECONNREFUSED");
    }) as typeof fetch;
    await assert.rejects(
      () =>
        new MelipayamakConsoleOtpService(configured()).sendOtp(
          "09121234567",
        ),
      InternalServerErrorException,
    );
  });

  test("a request that times out is surfaced as a coded 500, not left hanging", async () => {
    stubFetch(async () => {
      throw new DOMException("The operation was aborted.", "TimeoutError");
    });
    await assert.rejects(
      () =>
        new MelipayamakConsoleOtpService(configured()).sendOtp(
          "09121234567",
        ),
      InternalServerErrorException,
    );
  });
});
