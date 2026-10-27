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
    const { tokens } = await client.getToken({
      code,
      codeVerifier,
    } as never);
    if (!tokens.id_token) throw new Error("Google did not return an ID token");
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: this.clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new Error("Google ID token is missing sub/email");
    }
    return {
      googleId: payload.sub,
      email: payload.email,
      emailVerified: Boolean(payload.email_verified),
      name: payload.name ?? payload.email,
    };
  }
}
