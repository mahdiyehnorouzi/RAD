import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import {
  GoogleAuthService,
  GoogleOAuthStageError,
  GOOGLE_OAUTH_REASON_CODES,
  type GoogleOAuthReason,
  type GoogleOAuthStage,
} from "./google-auth.service";
import { OtpService } from "./otp.service";
import { ProfileService } from "./profile.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { OtpRequestDto } from "./dto/otp-request.dto";
import { OtpVerifyDto } from "./dto/otp-verify.dto";
import { RegisterDto } from "./dto/register.dto";
import { SessionDto } from "./dto/session.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
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

/**
 * `signInWithGoogle` codes that are safe to echo back to the browser as
 * `?authError=` — fixed, non-sensitive reason codes the storefront maps to
 * its own translated copy (`GOOGLE_AUTH_ERROR_CODE` in account-login.tsx),
 * never the thrown error's own message. Anything else (an unexpected
 * exception, a Google API failure, a DB error) falls back to the generic
 * `google_oauth_failed` below rather than being forwarded — this allowlist
 * is what keeps an unanticipated internal error message from ever reaching
 * the client.
 */
const SAFE_GOOGLE_AUTH_ERROR_CODES = new Set([
  "account_inactive",
  "google_email_unverified",
  "google_account_mismatch",
]);

/**
 * Turns whatever `googleCallback`'s try block threw into a stage + safe
 * reason for the warn log, plus (when it's one of the known account-state
 * codes above) the `authError` value to redirect the browser with. `stage`
 * is the last stage we entered before throwing — accurate for everything
 * except a network/DB error inside `identity_lookup`/`account_session`,
 * which carries a system error code we can still safely report.
 */
function classifyFailure(
  err: unknown,
  stage: GoogleOAuthStage | "identity_lookup" | "account_session",
): { stage: string; reason: GoogleOAuthReason; safeCode?: string } {
  if (err instanceof GoogleOAuthStageError) {
    return { stage: err.stage, reason: err.reason };
  }
  if (err instanceof UnauthorizedException) {
    const code = (err.getResponse() as { code?: string } | undefined)?.code;
    return {
      stage,
      reason: "unknown",
      safeCode:
        code && SAFE_GOOGLE_AUTH_ERROR_CODES.has(code) ? code : undefined,
    };
  }
  const systemCode = (err as { code?: unknown } | null)?.code;
  const reason = (GOOGLE_OAUTH_REASON_CODES as readonly string[]).includes(
    systemCode as string,
  )
    ? (systemCode as GoogleOAuthReason)
    : "unknown";
  return { stage, reason };
}

@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly auth: AuthService,
    private readonly google: GoogleAuthService,
    private readonly otp: OtpService,
    private readonly profiles: ProfileService,
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

  @Patch("profile")
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async updateProfile(
    @Body() body: UpdateProfileDto,
    @Req() request: AuthedRequest,
  ) {
    const actor = await this.identity.fromRequest(request);
    return this.profiles.update(actor, body);
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

  /**
   * Sends a login code to the given phone via Melipayamak. Verification
   * proves phone ownership only — no session/account is created yet (see
   * `OtpService`'s docstring).
   */
  @Post("otp/request")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async requestOtp(@Body() body: OtpRequestDto) {
    return this.otp.requestCode(body.phone);
  }

  @Post("otp/verify")
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async verifyOtp(@Body() body: OtpVerifyDto) {
    return this.otp.verifyCode(body.phone, body.code);
  }

  /**
   * Verifies the code and opens a session in one step — the only way an
   * SMS OTP sign-in actually happens. `otp/verify` above stays a
   * lower-level check (e.g. for a future "verify my phone" flow on an
   * existing account) and never issues a session itself.
   */
  @Post("otp/signin")
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async signInWithOtp(
    @Body() body: OtpVerifyDto,
    @Req() request: AuthedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { phone } = await this.otp.verifyCode(body.phone, body.code);
    const actor = await this.identity.fromRequest(request);
    const result = await this.auth.signInWithPhone(phone, actor);
    response.cookie(
      AUTH_COOKIE,
      result.sessionToken,
      sessionCookieOptions(result.maxAgeMs),
    );
    return { user: result.user };
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(AUTH_COOKIE, { path: "/" });
    return { user: null };
  }

  /**
   * Starts the Google sign-in redirect. `from` is a same-site path only —
   * see `safeReturnPath`. The storefront links here via `/backend/auth/google`
   * (same-origin, proxied), never this API's own domain directly, so the
   * `rad.google_oauth` cookie this sets eventually lands on the
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
    const { url, state, codeVerifier } =
      this.google.buildAuthorizationRequest();
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

    let stage: GoogleOAuthStage | "identity_lookup" | "account_session" =
      "token_exchange";
    try {
      const profile = await this.google.resolveProfile(
        code,
        saved.codeVerifier,
      );
      stage = "identity_lookup";
      const actor = await this.identity.fromRequest(request);
      stage = "account_session";
      const result = await this.auth.signInWithGoogle(profile, actor);
      response.clearCookie(GOOGLE_OAUTH_COOKIE, { path: "/" });
      response.cookie(
        AUTH_COOKIE,
        result.sessionToken,
        sessionCookieOptions(result.maxAgeMs),
      );
      response.redirect(`${origin}${returnPath}`);
    } catch (err) {
      // Never log the authorization code, state, PKCE verifier, the
      // resolved Google profile (email/name), or any raw error
      // message/stack — only the stage that failed and a safe reason code
      // from the fixed allowlist in `google-auth.service.ts`.
      const {
        stage: finalStage,
        reason,
        safeCode,
      } = classifyFailure(err, stage);
      this.logger.warn(
        `Google OAuth callback failed stage=${finalStage} reason=${reason}`,
      );
      fail(safeCode ?? "google_oauth_failed", returnPath);
    }
  }
}
