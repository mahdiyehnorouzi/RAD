import { Injectable, NestMiddleware } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE, GUEST_COOKIE, sessionCookieOptions } from "./cookies";

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
    let guestId = req.cookies?.[GUEST_COOKIE] as string | undefined;
    if (!guestId) {
      guestId = randomUUID();
      res.cookie(GUEST_COOKIE, guestId, sessionCookieOptions(1000 * 60 * 60 * 24 * 365));
    }
    req.guestId = guestId;

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
