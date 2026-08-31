import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { hash, compare } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { toAuthUser, type Actor, type AuthUser } from "../common/identity";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signIn(
    input: { name?: string; email: string; password: string },
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
    return { user, sessionToken };
  }

  async me(actor: Actor) {
    return { user: actor.user };
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
