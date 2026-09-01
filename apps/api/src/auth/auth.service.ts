import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomInt } from "node:crypto";
import { hash, compare } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { toAuthUser, type Actor, type AuthUser } from "../common/identity";

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;
const REMEMBER_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
const RESET_MAX_AGE_MS = 1000 * 60 * 15;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  sessionMaxAge(rememberMe?: boolean) {
    return rememberMe ? REMEMBER_MAX_AGE_MS : SESSION_MAX_AGE_MS;
  }

  async signIn(
    input: { name?: string; email: string; password: string; rememberMe?: boolean },
    actor: Actor,
  ) {
    const email = input.email.trim().toLowerCase();
    const name = input.name?.trim() ?? "";
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (!existing && !name) {
      throw new UnauthorizedException("نام، ایمیل معتبر و رمز عبور حداقل ۸ نویسه‌ای را وارد کنید.");
    }

    let user: AuthUser;

    if (existing) {
      if (existing.status === "invited") {
        throw new UnauthorizedException("این حساب هنوز فعال نشده است.");
      }
      const matches = await compare(input.password, existing.passwordHash);
      if (!matches) throw new UnauthorizedException("ایمیل یا رمز عبور نادرست است.");
      if (name && existing.name !== name) {
        await this.prisma.user.update({
          where: { id: existing.id },
          data: { name },
        });
      }
      user = toAuthUser({ ...existing, name: name || existing.name });
    } else {
      const created = await this.prisma.user.create({
        data: {
          name,
          email,
          passwordHash: await hash(input.password, 12),
          role: "customer",
          status: "active",
        },
      });
      user = toAuthUser(created);
    }

    await this.mergeGuestState(actor.guestId, user.id);
    await this.prisma.notice.create({
      data: { ownerKey: `user:${user.id}`, kind: "welcome" },
    });
    const sessionToken = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
      adminRole: user.adminRole ?? null,
    });
    return { user, sessionToken, maxAgeMs: this.sessionMaxAge(input.rememberMe) };
  }

  async me(actor: Actor) {
    return { user: actor.user };
  }

  async changePassword(actor: Actor, input: { currentPassword: string; newPassword: string }) {
    if (!actor.user) throw new UnauthorizedException("ابتدا وارد حساب شوید.");
    const user = await this.prisma.user.findUnique({ where: { id: actor.user.id } });
    if (!user?.adminRole) throw new UnauthorizedException("این حساب به دفتر کوره دسترسی ندارد.");
    const matches = await compare(input.currentPassword, user.passwordHash);
    if (!matches) throw new UnauthorizedException("رمز عبور فعلی نادرست است.");
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hash(input.newPassword, 12) },
    });
    return { ok: true };
  }

  async requestPasswordReset(email: string) {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (!user?.adminRole) {
      return {
        message: "اگر ایمیل شما در دفتر کوره ثبت شده باشد، کد بازیابی به آن ارسال می‌شود.",
      };
    }

    const code = String(randomInt(100000, 1_000_000));
    const tokenHash = createHash("sha256").update(code).digest("hex");
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_MAX_AGE_MS),
      },
    });

    await this.mail.sendPasswordResetCode(user.email, code);
    return {
      message: "کد بازیابی به ایمیل شما ارسال شد. صندوق ورودی و پوشهٔ اسپم را بررسی کنید.",
    };
  }

  async resetPassword(input: { email: string; code: string; password: string }) {
    const normalized = input.email.trim().toLowerCase();
    const code = input.code.trim();
    const tokenHash = createHash("sha256").update(code).digest("hex");
    const user = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (!user?.adminRole) {
      throw new NotFoundException("کد بازیابی نامعتبر یا منقضی شده است.");
    }

    const record = await this.prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        tokenHash,
        expiresAt: { gt: new Date() },
      },
    });
    if (!record) {
      throw new NotFoundException("کد بازیابی نامعتبر یا منقضی شده است.");
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await hash(input.password, 12),
          status: "active",
        },
      }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    ]);

    return { ok: true };
  }

  private async mergeGuestState(guestId: string, userId: string) {
    const from = `guest:${guestId}`;
    const to = `user:${userId}`;
    if (from === to) return;

    await this.moveRows(this.prisma.cartItem, from, to);
    await this.moveRows(this.prisma.favorite, from, to);
    await this.prisma.notice.updateMany({
      where: { ownerKey: from },
      data: { ownerKey: to },
    });
    await this.prisma.order.updateMany({
      where: { ownerKey: from },
      data: { ownerKey: to, userId },
    });
  }

  private async moveRows(
    delegate: {
      findMany: (args: { where: { ownerKey: string } }) => Promise<Array<{ id: string; productSlug: string }>>;
      findUnique: (args: {
        where: { ownerKey_productSlug: { ownerKey: string; productSlug: string } };
      }) => Promise<{ id: string } | null>;
      delete: (args: { where: { id: string } }) => Promise<unknown>;
      update: (args: { where: { id: string }; data: { ownerKey: string } }) => Promise<unknown>;
    },
    from: string,
    to: string,
  ) {
    const rows = await delegate.findMany({ where: { ownerKey: from } });
    for (const row of rows) {
      const duplicate = await delegate.findUnique({
        where: { ownerKey_productSlug: { ownerKey: to, productSlug: row.productSlug } },
      });
      if (duplicate) await delegate.delete({ where: { id: row.id } });
      else await delegate.update({ where: { id: row.id }, data: { ownerKey: to } });
    }
  }
}
