import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash, randomInt } from "node:crypto";
import { hash, compare } from "bcryptjs";
import { MoreThan, Repository } from "typeorm";
import {
  CartItem,
  Commission,
  Favorite,
  Notice,
  Order,
  PasswordResetToken,
  User,
} from "../database/entities";
import { MailService } from "../mail/mail.service";
import { InventoryService } from "../inventory/inventory.service";
import { toAuthUser, type Actor, type AuthUser } from "../common/identity";

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;
const REMEMBER_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
const RESET_MAX_AGE_MS = 1000 * 60 * 15;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Notice)
    private readonly notices: Repository<Notice>,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokens: Repository<PasswordResetToken>,
    @InjectRepository(CartItem)
    private readonly cartItems: Repository<CartItem>,
    @InjectRepository(Favorite)
    private readonly favorites: Repository<Favorite>,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(Commission)
    private readonly commissions: Repository<Commission>,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly inventory: InventoryService,
  ) {}

  sessionMaxAge(rememberMe?: boolean) {
    return rememberMe ? REMEMBER_MAX_AGE_MS : SESSION_MAX_AGE_MS;
  }

  async signIn(
    input: { email: string; password: string; rememberMe?: boolean },
    actor: Actor,
  ) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.users.findOne({ where: { email } });
    if (!existing) {
      throw new UnauthorizedException({
        message: "حسابی با این ایمیل وجود ندارد.",
        code: "account_missing",
      });
    }
    if (existing.status === "invited") {
      throw new UnauthorizedException({
        message: "این حساب هنوز فعال نشده است.",
        code: "account_inactive",
      });
    }
    if (!existing.passwordHash) {
      throw new UnauthorizedException({
        message: "این حساب با گوگل ساخته شده؛ با گوگل وارد شوید.",
        code: "google_only_account",
      });
    }
    const matches = await compare(input.password, existing.passwordHash);
    if (!matches) {
      throw new UnauthorizedException({
        message: "ایمیل یا رمز عبور نادرست است.",
        code: "bad_credentials",
      });
    }
    return this.openSession(toAuthUser(existing), actor, input.rememberMe);
  }

  async register(
    input: { name: string; email: string; password: string },
    actor: Actor,
  ) {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException({
        message: "این ایمیل قبلاً ثبت شده است. وارد شوید.",
        code: "account_exists",
      });
    }
    const created = await this.users.save(
      this.users.create({
        name,
        email,
        passwordHash: await hash(input.password, 12),
        role: "customer",
        status: "active",
      }),
    );
    await this.notices.save(
      this.notices.create({ ownerKey: `user:${created.id}`, kind: "welcome" }),
    );
    return this.openSession(toAuthUser(created), actor);
  }

  async me(actor: Actor) {
    return { user: actor.user };
  }

  /**
   * Called after the Google OAuth authorization-code exchange has already
   * verified `googleId`/`email` server-side (`GoogleStrategy`) — never
   * trusts a client-asserted identity. Matches an existing account by
   * `googleId` first (repeat sign-in), then by verified email (first
   * Google sign-in on an account that already has a password — Google
   * has already proven ownership of that email, so this links rather than
   * creating a duplicate identity), then creates a new, password-less
   * account. `emailVerified` must be true or this refuses to match/create
   * by email at all, since an unverified email proves nothing.
   */
  async signInWithGoogle(
    profile: {
      googleId: string;
      email: string;
      emailVerified: boolean;
      name: string;
    },
    actor: Actor,
  ) {
    const email = profile.email.trim().toLowerCase();
    let user = await this.users.findOne({
      where: { googleId: profile.googleId },
    });
    if (!user && profile.emailVerified) {
      const byEmail = await this.users.findOne({ where: { email } });
      if (byEmail) {
        await this.users.update(
          { id: byEmail.id },
          { googleId: profile.googleId },
        );
        byEmail.googleId = profile.googleId;
        user = byEmail;
      }
    }
    if (!user) {
      if (!profile.emailVerified) {
        throw new UnauthorizedException({
          message: "ایمیل گوگل تأیید نشده است.",
          code: "google_email_unverified",
        });
      }
      user = await this.users.save(
        this.users.create({
          name: profile.name.trim() || email,
          email,
          passwordHash: null,
          googleId: profile.googleId,
          role: "customer",
          status: "active",
        }),
      );
      await this.notices.save(
        this.notices.create({ ownerKey: `user:${user.id}`, kind: "welcome" }),
      );
    }
    return this.openSession(toAuthUser(user), actor);
  }

  async changePassword(
    actor: Actor,
    input: { currentPassword: string; newPassword: string },
  ) {
    if (!actor.user) throw new UnauthorizedException("ابتدا وارد حساب شوید.");
    const user = await this.users.findOne({ where: { id: actor.user.id } });
    if (!user?.adminRole)
      throw new UnauthorizedException("این حساب به دفتر کوره دسترسی ندارد.");
    if (!user.passwordHash)
      throw new UnauthorizedException("این حساب با گوگل ساخته شده؛ رمز عبوری ندارد.");
    const matches = await compare(input.currentPassword, user.passwordHash);
    if (!matches) throw new UnauthorizedException("رمز عبور فعلی نادرست است.");
    await this.users.update(
      { id: user.id },
      { passwordHash: await hash(input.newPassword, 12) },
    );
    return { ok: true };
  }

  async requestPasswordReset(email: string) {
    const normalized = email.trim().toLowerCase();
    const user = await this.users.findOne({ where: { email: normalized } });
    if (!user || user.status === "invited") {
      return {
        message: "اگر این ایمیل ثبت شده باشد، کد بازیابی به آن ارسال می‌شود.",
      };
    }

    const code = String(randomInt(100000, 1_000_000));
    const tokenHash = createHash("sha256").update(code).digest("hex");
    await this.resetTokens.delete({ userId: user.id });
    await this.resetTokens.save(
      this.resetTokens.create({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_MAX_AGE_MS),
      }),
    );

    await this.mail.sendPasswordResetCode(user.email, code);
    return {
      message:
        "کد بازیابی به ایمیل شما ارسال شد. صندوق ورودی و پوشهٔ اسپم را بررسی کنید.",
    };
  }

  async resetPassword(input: {
    email: string;
    code: string;
    password: string;
  }) {
    const normalized = input.email.trim().toLowerCase();
    const code = input.code.trim();
    const tokenHash = createHash("sha256").update(code).digest("hex");
    const user = await this.users.findOne({ where: { email: normalized } });
    if (!user) {
      throw new NotFoundException("کد بازیابی نامعتبر یا منقضی شده است.");
    }

    const record = await this.resetTokens.findOne({
      where: {
        userId: user.id,
        tokenHash,
        expiresAt: MoreThan(new Date()),
      },
    });
    if (!record) {
      throw new NotFoundException("کد بازیابی نامعتبر یا منقضی شده است.");
    }

    await this.users.update(
      { id: user.id },
      {
        passwordHash: await hash(input.password, 12),
        status: "active",
      },
    );
    await this.resetTokens.delete({ userId: user.id });

    return { ok: true };
  }

  private async openSession(
    user: AuthUser,
    actor: Actor,
    rememberMe?: boolean,
  ) {
    await this.mergeGuestState(actor.guestId, user.id);
    const sessionToken = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
      adminRole: user.adminRole ?? null,
    });
    return { user, sessionToken, maxAgeMs: this.sessionMaxAge(rememberMe) };
  }

  private async mergeGuestState(guestId: string, userId: string) {
    const from = `guest:${guestId}`;
    const to = `user:${userId}`;
    if (from === to) return;

    await this.moveRows(this.cartItems, from, to);
    await this.inventory.transferHolds(from, to);
    await this.moveRows(this.favorites, from, to);
    await this.notices.update({ ownerKey: from }, { ownerKey: to });
    await this.orders.update({ ownerKey: from }, { ownerKey: to, userId });
    await this.commissions.update({ ownerKey: from }, { ownerKey: to });
  }

  private async moveRows(
    repo: Repository<CartItem> | Repository<Favorite>,
    from: string,
    to: string,
  ) {
    const rows = await repo.find({ where: { ownerKey: from } });
    for (const row of rows) {
      const duplicate = await repo.findOne({
        where: { ownerKey: to, productSlug: row.productSlug },
      });
      if (duplicate) await repo.delete({ id: row.id });
      else await repo.update({ id: row.id }, { ownerKey: to });
    }
  }
}
