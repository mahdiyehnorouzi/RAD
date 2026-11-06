import "reflect-metadata";
import assert from "node:assert/strict";
import { test } from "node:test";
import { Logger, UnauthorizedException } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { GoogleOAuthStageError } from "./google-auth.service";

/**
 * Covers the `googleCallback` diagnostics added for the production Google
 * sign-in failures: a `stage` + allowlisted `reason` in the warn log, and
 * that nothing sensitive (raw error text, codes, tokens) ever reaches it.
 * No DB/HTTP — `AuthController` is instantiated directly with stub
 * collaborators, same pattern as `auth.controller.spec.ts`.
 */

function fakeResponse() {
  const calls: { cleared: string[]; cookies: unknown[]; redirects: string[] } =
    {
      cleared: [],
      cookies: [],
      redirects: [],
    };
  return {
    calls,
    response: {
      clearCookie: (name: string) => calls.cleared.push(name),
      cookie: (...args: unknown[]) => calls.cookies.push(args),
      redirect: (url: string) => calls.redirects.push(url),
    } as never,
  };
}

function fakeRequest(savedCookie: unknown) {
  return {
    cookies: {
      "rad.google_oauth": JSON.stringify(savedCookie),
    },
  } as never;
}

async function runCallback(controller: AuthController, warnings: string[]) {
  const { response, calls } = fakeResponse();
  const saved = { state: "s", codeVerifier: "v", from: "/account" };
  (controller as unknown as { logger: Logger }).logger = {
    warn: (message: string) => warnings.push(message),
  } as never;
  await controller.googleCallback(
    "code",
    "s",
    undefined,
    fakeRequest(saved),
    response,
  );
  return calls;
}

test("token exchange failure logs stage=token_exchange with the mapped reason, and redirects generically", async () => {
  const warnings: string[] = [];
  const controller = new AuthController(
    {} as never,
    {
      configured: true,
      resolveProfile: async () => {
        throw new GoogleOAuthStageError(
          "token_exchange",
          "invalid_grant",
          new Error("some leaked detail that must never be logged"),
        );
      },
    } as never,
    {} as never,
    {} as never,
    {} as never,
  );

  const calls = await runCallback(controller, warnings);

  assert.equal(warnings.length, 1);
  assert.equal(
    warnings[0],
    "Google OAuth callback failed stage=token_exchange reason=invalid_grant",
  );
  assert.match(calls.redirects[0], /authError=google_oauth_failed/);
});

test("ID-token verification failure is reported as its own stage", async () => {
  const warnings: string[] = [];
  const controller = new AuthController(
    {} as never,
    {
      configured: true,
      resolveProfile: async () => {
        throw new GoogleOAuthStageError(
          "id_token_verification",
          "invalid_token",
        );
      },
    } as never,
    {} as never,
    {} as never,
    {} as never,
  );

  await runCallback(controller, warnings);

  assert.equal(
    warnings[0],
    "Google OAuth callback failed stage=id_token_verification reason=invalid_token",
  );
});

test("a DNS/network error reaching the identity lookup is reported with its system code, not 'unknown'", async () => {
  const warnings: string[] = [];
  const controller = new AuthController(
    {} as never,
    {
      configured: true,
      resolveProfile: async () => ({
        googleId: "g1",
        email: "a@example.com",
        emailVerified: true,
        name: "A",
      }),
    } as never,
    {} as never,
    {} as never,
    {
      fromRequest: async () => {
        const err = new Error("getaddrinfo EAI_AGAIN db.internal") as Error & {
          code?: string;
        };
        err.code = "EAI_AGAIN";
        throw err;
      },
    } as never,
  );

  await runCallback(controller, warnings);

  assert.equal(
    warnings[0],
    "Google OAuth callback failed stage=identity_lookup reason=EAI_AGAIN",
  );
});

test("an UnauthorizedException's known code still drives the redirect, and the stage is account_session", async () => {
  const warnings: string[] = [];
  const controller = new AuthController(
    {
      signInWithGoogle: async () => {
        throw new UnauthorizedException({
          message: "این حساب هنوز فعال نشده است.",
          code: "account_inactive",
        });
      },
    } as never,
    {
      configured: true,
      resolveProfile: async () => ({
        googleId: "g1",
        email: "a@example.com",
        emailVerified: true,
        name: "A",
      }),
    } as never,
    {} as never,
    {} as never,
    { fromRequest: async () => ({ user: null, guestId: "guest-1" }) } as never,
  );

  const calls = await runCallback(controller, warnings);

  assert.equal(
    warnings[0],
    "Google OAuth callback failed stage=account_session reason=unknown",
  );
  assert.match(calls.redirects[0], /authError=account_inactive/);
});

test("an unrecognized system code falls back to reason=unknown rather than leaking it", async () => {
  const warnings: string[] = [];
  const controller = new AuthController(
    {} as never,
    {
      configured: true,
      resolveProfile: async () => ({
        googleId: "g1",
        email: "a@example.com",
        emailVerified: true,
        name: "A",
      }),
    } as never,
    {} as never,
    {} as never,
    {
      fromRequest: async () => {
        const err = new Error("boom") as Error & { code?: string };
        err.code = "SOME_UNLISTED_CODE";
        throw err;
      },
    } as never,
  );

  const warningsBefore = warnings.length;
  await runCallback(controller, warnings);

  assert.equal(
    warnings[warningsBefore],
    "Google OAuth callback failed stage=identity_lookup reason=unknown",
  );
  assert.ok(!warnings[warningsBefore].includes("boom"));
  assert.ok(!warnings[warningsBefore].includes("SOME_UNLISTED_CODE"));
});
