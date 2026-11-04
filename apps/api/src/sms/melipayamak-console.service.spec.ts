import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { ConfigService } from "@nestjs/config";
import { InternalServerErrorException } from "@nestjs/common";
import { MelipayamakConsoleService } from "./melipayamak-console.service";

function configured(overrides: Record<string, string> = {}) {
  return new ConfigService({
    MELIPAYAMAK_CONSOLE_API_TOKEN: "console-token-123",
    MELIPAYAMAK_CONSOLE_SENDER: "3000123456",
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

describe("MelipayamakConsoleService: configuration validation", () => {
  test("isConfigured() is false when either var is missing", () => {
    assert.equal(
      new MelipayamakConsoleService(new ConfigService({})).isConfigured(),
      false,
    );
    assert.equal(
      new MelipayamakConsoleService(
        new ConfigService({ MELIPAYAMAK_CONSOLE_API_TOKEN: "t" }),
      ).isConfigured(),
      false,
    );
  });

  test("isConfigured() is true once both are present", () => {
    assert.equal(
      new MelipayamakConsoleService(configured()).isConfigured(),
      true,
    );
  });

  test("sending with missing config throws a coded error instead of silently succeeding", async () => {
    const sms = new MelipayamakConsoleService(new ConfigService({}));
    await assert.rejects(
      () => sms.sendSimple("09121234567", "hello"),
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
    const sms = new MelipayamakConsoleService(new ConfigService({}));
    await assert.rejects(
      () => sms.sendSimple("09121234567", "hello"),
      (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        assert.doesNotMatch(message, /console-token/);
        return true;
      },
    );
  });
});

describe("MelipayamakConsoleService: request shape", () => {
  test("posts JSON with from/to/text and the token in the URL path", async () => {
    let capturedUrl = "";
    let capturedBody: unknown;
    let capturedContentType = "";
    stubFetch(async (url, init) => {
      capturedUrl = url;
      capturedBody = JSON.parse(String(init.body));
      capturedContentType = String(
        (init.headers as Record<string, string>)?.["content-type"],
      );
      return new Response(JSON.stringify({ recId: 123 }), { status: 200 });
    });

    await new MelipayamakConsoleService(configured()).sendSimple(
      "09121234567",
      "hello there",
    );

    assert.equal(
      capturedUrl,
      "https://console.melipayamak.com/api/send/simple/console-token-123",
    );
    assert.deepEqual(capturedBody, {
      from: "3000123456",
      to: "09121234567",
      text: "hello there",
    });
    assert.equal(capturedContentType, "application/json");
  });
});

describe("MelipayamakConsoleService: response handling", () => {
  test("a 2xx response with a positive numeric recId is a success", async () => {
    stubFetch(
      async () =>
        new Response(JSON.stringify({ recId: 987654321 }), { status: 200 }),
    );
    await new MelipayamakConsoleService(configured()).sendSimple(
      "09121234567",
      "ok",
    );
  });

  test("a 2xx response with no recognizable recId throws", async () => {
    stubFetch(async () => new Response(JSON.stringify({}), { status: 200 }));
    await assert.rejects(
      () =>
        new MelipayamakConsoleService(configured()).sendSimple(
          "09121234567",
          "x",
        ),
      InternalServerErrorException,
    );
  });

  test("a 2xx response with a non-JSON body throws rather than assuming success", async () => {
    stubFetch(async () => new Response("not json", { status: 200 }));
    await assert.rejects(
      () =>
        new MelipayamakConsoleService(configured()).sendSimple(
          "09121234567",
          "x",
        ),
      InternalServerErrorException,
    );
  });

  test("a non-2xx HTTP response throws even with a plausible-looking body", async () => {
    stubFetch(
      async () => new Response(JSON.stringify({ recId: 1 }), { status: 500 }),
    );
    await assert.rejects(
      () =>
        new MelipayamakConsoleService(configured()).sendSimple(
          "09121234567",
          "x",
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
        new MelipayamakConsoleService(configured()).sendSimple(
          "09121234567",
          "x",
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
        new MelipayamakConsoleService(configured()).sendSimple(
          "09121234567",
          "x",
        ),
      InternalServerErrorException,
    );
  });
});
