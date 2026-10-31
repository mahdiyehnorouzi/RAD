import { Injectable, NestMiddleware } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE, GUEST_COOKIE, sessionCookieOptions } from "./cookies";
import { resolveGuestId } from "./guest-id";

export type AuthedRequest = Request & {
  userId?: string;
  userRole?: string;
  adminRole?: string;
  guestId: string;
};

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(private readonly jwt: JwtService) {}

  async use(req: AuthedRequest, res: Response, next: NextFunction) {
    const guest = resolveGuestId({
      cookie: req.cookies?.[GUEST_COOKIE] as string | undefined,
      header: req.get("x-rad-guest"),
      mint: () => randomUUID(),
    });
    if (guest.setCookie) {
      res.cookie(
        GUEST_COOKIE,
        guest.id,
        sessionCookieOptions(1000 * 60 * 60 * 24 * 365),
      );
    }
    req.guestId = guest.id;

    const token = req.cookies?.[AUTH_COOKIE] as string | undefined;
    if (token) {
      try {
        const payload = await this.jwt.verifyAsync<{
          sub: string;
          role: string;
          adminRole?: string | null;
        }>(token);
        req.userId = payload.sub;
        req.userRole = payload.role;
        req.adminRole = payload.adminRole ?? undefined;
      } catch {
        res.clearCookie(AUTH_COOKIE, { path: "/" });
      }
    }
    next();
  }
}
