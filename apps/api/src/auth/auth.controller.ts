import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import { GoogleAuthService } from "./google-auth.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { RegisterDto } from "./dto/register.dto";
import { SessionDto } from "./dto/session.dto";
import { IdentityService } from "../common/identity.service";
import type { AuthedRequest } from "../common/session.middleware";
import {
  AUTH_COOKIE,
  GOOGLE_OAUTH_COOKIE,
  oauthCookieOptions,
  sessionCookieOptions,
} from "../common/cookies";
import { safeReturnPath, storefrontOrigin } from "../common/storefront-origin";

const GOOGLE_OAUTH_MAX_AGE_MS = 10 * 60 * 1000;

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly google: GoogleAuthService,
    private readonly identity: IdentityService,
  ) {}

  @Get("me")
  async me(@Req() request: AuthedRequest) {
    return this.auth.me(await this.identity.fromRequest(request));
  }

  @Post("session")
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async session(
    @Body() body: SessionDto,
    @Req() request: AuthedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const actor = await this.identity.fromRequest(request);
    const result = await this.auth.signIn(body, actor);
    response.cookie(
      AUTH_COOKIE,
      result.sessionToken,
      sessionCookieOptions(result.maxAgeMs),
    );
    return { user: result.user };
  }

  @Post("register")
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async register(
    @Body() body: RegisterDto,
    @Req() request: AuthedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const actor = await this.identity.fromRequest(request);
    const result = await this.auth.register(body, actor);
    response.cookie(
      AUTH_COOKIE,
      result.sessionToken,
      sessionCookieOptions(result.maxAgeMs),
    );
    return { user: result.user };
  }

  @Patch("password")
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async changePassword(
    @Body() body: ChangePasswordDto,
    @Req() request: AuthedRequest,
  ) {
    const actor = await this.identity.fromRequest(request);
    return this.auth.changePassword(actor, body);
  }

  @Post("password/forgot")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.auth.requestPasswordReset(body.email);
  }

  @Post("password/reset")
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.auth.resetPassword(body);
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(AUTH_COOKIE, { path: "/" });
    return { user: null };
  }

  /**
   * Starts the Google sign-in redirect. `from` is a same-site path only —
   * see `safeReturnPath`. The storefront links here via
   * `/backend/auth/google` (same-origin, proxied), never this API's own
   * domain directly, so the
   * `rad.auth` cookie `googleCallback` eventually sets lands on the
   * storefront's domain — see `.env.example`'s `GOOGLE_CALLBACK_URL` note.
   */
  @Get("google")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  googleStart(
    @Query("from") from: string | undefined,
    @Res() response: Response,
  ) {
    if (!this.google.configured) {
      throw new BadRequestException({
        message: "ورود با گوگل در این محیط فعال نیست.",
        code: "google_not_configured",
      });
    }
    const { url, state, codeVerifier } = this.google.buildAuthorizationRequest();
    response.cookie(
      GOOGLE_OAUTH_COOKIE,
      JSON.stringify({ state, codeVerifier, from: safeReturnPath(from) }),
      oauthCookieOptions(GOOGLE_OAUTH_MAX_AGE_MS),
    );
    response.redirect(url);
  }

  /** Google's redirect target. Always redirects the browser back into the storefront — success or failure. */
  @Get("google/callback")
  async googleCallback(
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Query("error") error: string | undefined,
    @Req() request: AuthedRequest,
    @Res() response: Response,
  ) {
    const origin = storefrontOrigin();
    const fail = (reason: string, from = "/account") => {
      response.clearCookie(GOOGLE_OAUTH_COOKIE, { path: "/" });
      response.redirect(
        `${origin}${from}?authError=${encodeURIComponent(reason)}`,
      );
    };

    let saved: { state?: string; codeVerifier?: string; from?: string } = {};
    try {
      saved = JSON.parse(request.cookies?.[GOOGLE_OAUTH_COOKIE] ?? "{}");
    } catch {
      // malformed/expired cookie — handled by the missing-field checks below
    }
    const returnPath = safeReturnPath(saved.from);

    if (error) return fail(error, returnPath);
    if (!code || !state || !saved.state || !saved.codeVerifier) {
      return fail("google_oauth_missing_params", returnPath);
    }
    if (state !== saved.state) {
      return fail("google_oauth_state_mismatch", returnPath);
    }

    try {
      const profile = await this.google.resolveProfile(code, saved.codeVerifier);
      const actor = await this.identity.fromRequest(request);
      const result = await this.auth.signInWithGoogle(profile, actor);
      response.clearCookie(GOOGLE_OAUTH_COOKIE, { path: "/" });
      response.cookie(
        AUTH_COOKIE,
        result.sessionToken,
        sessionCookieOptions(result.maxAgeMs),
      );
      response.redirect(`${origin}${returnPath}`);
    } catch {
      fail("google_oauth_failed", returnPath);
    }
  }
}
