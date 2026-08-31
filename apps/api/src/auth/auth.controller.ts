import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import { SessionDto } from "./dto/session.dto";
import { IdentityService } from "../common/identity.service";
import type { AuthedRequest } from "../common/session.middleware";
import { AUTH_COOKIE, sessionCookieOptions } from "../common/cookies";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
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
      sessionCookieOptions(1000 * 60 * 60 * 24 * 7),
    );
    return { user: result.user };
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(AUTH_COOKIE, { path: "/" });
    return { user: null };
  }
}
