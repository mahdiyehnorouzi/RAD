import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes, createHash } from "node:crypto";
import { OAuth2Client } from "google-auth-library";

export type GoogleProfile = {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string;
};

/** Which step of `resolveProfile` failed — logged alongside a safe `reason`, never the raw error. */
export type GoogleOAuthStage = "token_exchange" | "id_token_verification";

/**
 * Explicit allowlist of safe reason codes for a failed OAuth step: the
 * OAuth 2.0 token-endpoint `error` values we actually expect from Google
 * (https://www.rfc-editor.org/rfc/rfc6749#section-5.2), plus the DNS/network
 * `code`s seen on this VPS, plus our own `invalid_token` for an ID token
 * that fails local verification. Never log the underlying error message —
 * it may contain request/response details.
 */
export const GOOGLE_OAUTH_REASON_CODES = [
  "invalid_client",
  "invalid_grant",
  "invalid_request",
  "unauthorized_client",
  "unsupported_grant_type",
  "invalid_token",
  "EAI_AGAIN",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ECONNRESET",
  "unknown",
] as const;
export type GoogleOAuthReason = (typeof GOOGLE_OAUTH_REASON_CODES)[number];

function isSafeReason(value: unknown): value is GoogleOAuthReason {
  return (
    typeof value === "string" &&
    (GOOGLE_OAUTH_REASON_CODES as readonly string[]).includes(value)
  );
}

/**
 * Duck-typed in place of `instanceof GaxiosError`: `gaxios` is only a
 * transitive dependency of `google-auth-library`, not one of ours, so we
 * don't import its class directly. Both the token-exchange and the
 * certs-fetch HTTP calls throw this shape on a network failure or a
 * non-2xx response.
 */
function reasonFromError(err: unknown): GoogleOAuthReason {
  if (typeof err !== "object" || err === null) return "unknown";
  const data = (err as { response?: { data?: unknown } }).response?.data;
  const oauthError =
    data && typeof data === "object"
      ? (data as { error?: unknown }).error
      : undefined;
  if (isSafeReason(oauthError)) return oauthError;
  const code = (err as { code?: unknown }).code;
  if (isSafeReason(code)) return code;
  return "unknown";
}

/** Thrown by `resolveProfile` so the caller can log a stage + safe reason without the raw error. */
export class GoogleOAuthStageError extends Error {
  constructor(
    readonly stage: GoogleOAuthStage,
    readonly reason: GoogleOAuthReason,
    cause?: unknown,
  ) {
    super(`Google OAuth ${stage} failed: ${reason}`);
    this.cause = cause;
  }
}

function base64url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Standard OAuth 2.0 authorization-code + PKCE flow, using Google's own
 * `google-auth-library` for the code exchange and (critically) server-side
 * ID-token verification — never trusts a client-asserted email/subject id.
 * `state` and the PKCE `code_verifier` are generated here and round-tripped
 * through a short-lived httpOnly cookie (`GOOGLE_OAUTH_COOKIE`), not query
 * params, so neither can be read or replayed by a third party.
 *
 * Disabled (both methods throw) when `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`
 * aren't configured, so the rest of the API boots and runs fine without
 * real Google credentials — see `AuthController`'s `configured` check.
 */
@Injectable()
export class GoogleAuthService {
  private readonly clientId?: string;
  private readonly clientSecret?: string;
  private readonly redirectUri?: string;

  constructor(private readonly config: ConfigService) {
    this.clientId = this.config.get<string>("GOOGLE_CLIENT_ID") || undefined;
    this.clientSecret =
      this.config.get<string>("GOOGLE_CLIENT_SECRET") || undefined;
    this.redirectUri =
      this.config.get<string>("GOOGLE_CALLBACK_URL") || undefined;
  }

  get configured() {
    return Boolean(this.clientId && this.clientSecret && this.redirectUri);
  }

  private client() {
    if (!this.configured) {
      throw new Error("Google OAuth is not configured");
    }
    return new OAuth2Client({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      redirectUri: this.redirectUri,
    });
  }

  /** `state`/`codeVerifier` to store in the round-trip cookie, plus the URL to redirect the browser to. */
  buildAuthorizationRequest() {
    const state = base64url(randomBytes(24));
    const codeVerifier = base64url(randomBytes(32));
    const codeChallenge = base64url(
      createHash("sha256").update(codeVerifier).digest(),
    );
    const url = this.client().generateAuthUrl({
      access_type: "online",
      scope: ["openid", "email", "profile"],
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256" as never,
    });
    return { url, state, codeVerifier };
  }

  /** Exchanges the authorization code and verifies the returned ID token server-side. */
  async resolveProfile(
    code: string,
    codeVerifier: string,
  ): Promise<GoogleProfile> {
    const client = this.client();
    let tokens: import("google-auth-library").Credentials;
    try {
      const result = await client.getToken({ code, codeVerifier } as never);
      tokens = result.tokens;
    } catch (err) {
      throw new GoogleOAuthStageError(
        "token_exchange",
        reasonFromError(err),
        err,
      );
    }
    if (!tokens.id_token) {
      throw new GoogleOAuthStageError("token_exchange", "unknown");
    }

    try {
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: this.clientId,
      });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email) {
        throw new GoogleOAuthStageError(
          "id_token_verification",
          "invalid_token",
        );
      }
      return {
        googleId: payload.sub,
        email: payload.email,
        emailVerified: Boolean(payload.email_verified),
        name: payload.name ?? payload.email,
      };
    } catch (err) {
      if (err instanceof GoogleOAuthStageError) throw err;
      const reason = reasonFromError(err);
      throw new GoogleOAuthStageError(
        "id_token_verification",
        reason === "unknown" ? "invalid_token" : reason,
        err,
      );
    }
  }
}
