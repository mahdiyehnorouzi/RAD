import assert from "node:assert/strict";
import { test } from "node:test";
import { ConfigService } from "@nestjs/config";
import {
  GoogleAuthService,
  GoogleOAuthStageError,
} from "./google-auth.service";

/**
 * Unit coverage for `GoogleAuthService.resolveProfile`'s stage/reason
 * classification, with a mocked OAuth client (`client()` is private and
 * always builds a real `OAuth2Client`, so we override the bound method on
 * the instance rather than hitting the network or restructuring the class
 * just for testability).
 */

function serviceWithClient(client: {
  getToken: (...args: unknown[]) => unknown;
  verifyIdToken: (...args: unknown[]) => unknown;
}) {
  const service = new GoogleAuthService(
    new ConfigService({
      GOOGLE_CLIENT_ID: "client-id",
      GOOGLE_CLIENT_SECRET: "client-secret",
      GOOGLE_CALLBACK_URL: "https://api.example.com/auth/google/callback",
    }),
  );
  (service as unknown as { client: () => unknown }).client = () => client;
  return service;
}

test("a token-exchange failure with an OAuth error body is reason=invalid_grant, stage=token_exchange", async () => {
  const service = serviceWithClient({
    getToken: async () => {
      const err = Object.assign(new Error("token endpoint rejected it"), {
        response: { data: { error: "invalid_grant" } },
      });
      throw err;
    },
    verifyIdToken: async () => {
      throw new Error("should not be reached");
    },
  });

  await assert.rejects(
    () => service.resolveProfile("auth-code", "verifier"),
    (error: unknown) => {
      assert.ok(error instanceof GoogleOAuthStageError);
      assert.equal(error.stage, "token_exchange");
      assert.equal(error.reason, "invalid_grant");
      return true;
    },
  );
});

test("an unclassified verifyIdToken failure (e.g. a bad signature, not missing claims) stays reason=unknown, not invalid_token", async () => {
  const service = serviceWithClient({
    getToken: async () => ({ tokens: { id_token: "some.jwt.token" } }),
    verifyIdToken: async () => {
      throw new Error("Invalid token signature: some.jwt.token");
    },
  });

  await assert.rejects(
    () => service.resolveProfile("auth-code", "verifier"),
    (error: unknown) => {
      assert.ok(error instanceof GoogleOAuthStageError);
      assert.equal(error.stage, "id_token_verification");
      assert.equal(error.reason, "unknown");
      return true;
    },
  );
});

test("missing sub/email after verification is explicitly reason=invalid_token", async () => {
  const service = serviceWithClient({
    getToken: async () => ({ tokens: { id_token: "some.jwt.token" } }),
    verifyIdToken: async () => ({
      getPayload: () => ({ email_verified: true }), // no sub, no email
    }),
  });

  await assert.rejects(
    () => service.resolveProfile("auth-code", "verifier"),
    (error: unknown) => {
      assert.ok(error instanceof GoogleOAuthStageError);
      assert.equal(error.stage, "id_token_verification");
      assert.equal(error.reason, "invalid_token");
      return true;
    },
  );
});

test("a network failure while fetching Google's certs is reported with its system code, stage=id_token_verification", async () => {
  const service = serviceWithClient({
    getToken: async () => ({ tokens: { id_token: "some.jwt.token" } }),
    verifyIdToken: async () => {
      const err = Object.assign(new Error("getaddrinfo EAI_AGAIN"), {
        code: "EAI_AGAIN",
      });
      throw err;
    },
  });

  await assert.rejects(
    () => service.resolveProfile("auth-code", "verifier"),
    (error: unknown) => {
      assert.ok(error instanceof GoogleOAuthStageError);
      assert.equal(error.stage, "id_token_verification");
      assert.equal(error.reason, "EAI_AGAIN");
      return true;
    },
  );
});

test("a successful exchange and verification never throws, and returns the verified profile", async () => {
  const service = serviceWithClient({
    getToken: async () => ({ tokens: { id_token: "some.jwt.token" } }),
    verifyIdToken: async () => ({
      getPayload: () => ({
        sub: "google-sub-1",
        email: "person@example.com",
        email_verified: true,
        name: "Person",
      }),
    }),
  });

  const profile = await service.resolveProfile("auth-code", "verifier");
  assert.deepEqual(profile, {
    googleId: "google-sub-1",
    email: "person@example.com",
    emailVerified: true,
    name: "Person",
  });
});

test("none of the thrown stage errors' messages contain the raw underlying error text", async () => {
  const service = serviceWithClient({
    getToken: async () => {
      throw new Error(
        "SENSITIVE: client_secret=abc123 code=super-secret-auth-code",
      );
    },
    verifyIdToken: async () => {
      throw new Error("should not be reached");
    },
  });

  await assert.rejects(
    () => service.resolveProfile("auth-code", "verifier"),
    (error: unknown) => {
      assert.ok(error instanceof GoogleOAuthStageError);
      assert.ok(!error.message.includes("SENSITIVE"));
      assert.ok(!error.message.includes("abc123"));
      assert.ok(!error.message.includes("super-secret-auth-code"));
      return true;
    },
  );
});
