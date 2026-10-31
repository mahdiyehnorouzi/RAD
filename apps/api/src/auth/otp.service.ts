import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, MoreThan, Repository } from "typeorm";
import { OtpCode } from "../database/entities";
import { MelipayamakService } from "../sms/melipayamak.service";
import { normalizeIranianMobile } from "../sms/phone";
import {
  generateVerificationCode,
  hashVerificationCode,
} from "./reset-token.util";

const OTP_TTL_MS = 2 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

/**
 * SMS OTP primitive: send a code, verify it. Deliberately stops here —
 * creating/linking a `User` by phone needs its own migration
 * (`User.phone`, and making `email` optional) and account-linking policy,
 * staged as a follow-up PR per the phase-2 sequencing plan. This PR only
 * proves phone ownership; nothing consumes that proof yet.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectRepository(OtpCode)
    private readonly codes: Repository<OtpCode>,
    private readonly sms: MelipayamakService,
    private readonly dataSource: DataSource,
  ) {}

  private requirePhone(raw: string) {
    const phone = normalizeIranianMobile(raw);
    if (!phone) {
      throw new BadRequestException({
        message: "شماره موبایل را به‌صورت صحیح وارد کنید (مثال: ۰۹۱۲۳۴۵۶۷۸۹).",
        code: "phone_invalid",
      });
    }
    return phone;
  }

  async requestCode(rawPhone: string) {
    const phone = this.requirePhone(rawPhone);

    const recent = await this.codes.findOne({
      where: {
        phone,
        createdAt: MoreThan(new Date(Date.now() - RESEND_COOLDOWN_MS)),
      },
      order: { createdAt: "DESC" },
    });
    if (recent) {
      throw new BadRequestException({
        message: "کد ورود به‌تازگی ارسال شده؛ کمی صبر کنید و دوباره تلاش کنید.",
        code: "otp_cooldown",
      });
    }

    const { code, tokenHash, expiresAt } = generateVerificationCode(OTP_TTL_MS);
    // One active code per phone: an old, unconsumed code from a prior
    // request must never still verify once a newer one has been sent.
    await this.codes.delete({ phone });
    await this.codes.save(
      this.codes.create({ phone, codeHash: tokenHash, expiresAt }),
    );

    try {
      await this.sms.sendOtp(phone, code);
    } catch (error) {
      // Don't leave an unusable, unreachable code sitting active: the next
      // request should be a normal retry, not blocked by the cooldown for
      // a send that never actually reached the phone.
      await this.codes.delete({ phone });
      throw error;
    }

    return {
      message: "کد ورود برای شما پیامک شد.",
      expiresInSeconds: Math.round(OTP_TTL_MS / 1000),
    };
  }

  /**
   * Marks the code consumed on success. Returns only a boolean — no session
   * is opened here.
   *
   * Runs under a row lock (`pessimistic_write`) for the same reason
   * `InventoryService` locks a `Product` row before touching it: without
   * one, concurrent calls (a burst of parallel requests, trivial for an
   * attacker to send) each read the same `attempts` count before any of
   * their updates commit, so every one of them passes the "attempts < 5"
   * check and the increments race-overwrite each other instead of
   * accumulating — the 5-attempt cap on a 6-digit code is only real
   * protection if attempts are checked and incremented atomically per
   * guess, not read-then-blind-write.
   */
  async verifyCode(rawPhone: string, rawCode: string) {
    const phone = this.requirePhone(rawPhone);
    const code = rawCode.trim();

    // The outcome is computed and returned (never thrown) from inside the
    // transaction: `DataSource.transaction()` rolls back everything the
    // callback did the moment it throws, which would silently undo the
    // very attempts-increment this lock exists to make stick. Committing
    // first and throwing after, from the plain return value, is what
    // actually makes the increment durable.
    const outcome = await this.dataSource.transaction(async (manager) => {
      const record = await manager.getRepository(OtpCode).findOne({
        where: { phone, expiresAt: MoreThan(new Date()) },
        order: { createdAt: "DESC" },
        lock: { mode: "pessimistic_write" },
      });
      if (!record || record.consumedAt) {
        return { kind: "expired" as const };
      }
      if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
        return { kind: "too_many_attempts" as const };
      }

      if (hashVerificationCode(code) !== record.codeHash) {
        await manager
          .getRepository(OtpCode)
          .update({ id: record.id }, { attempts: record.attempts + 1 });
        return { kind: "wrong_code" as const };
      }

      await manager
        .getRepository(OtpCode)
        .update({ id: record.id }, { consumedAt: new Date() });
      return { kind: "verified" as const };
    });

    switch (outcome.kind) {
      case "expired":
        throw new NotFoundException({
          message: "کد ورود نامعتبر یا منقضی شده است.",
          code: "otp_expired",
        });
      case "too_many_attempts":
        throw new BadRequestException({
          message: "تعداد تلاش‌های مجاز تمام شده؛ کد جدید درخواست کنید.",
          code: "otp_too_many_attempts",
        });
      case "wrong_code":
        throw new BadRequestException({
          message: "کد وارد شده درست نیست.",
          code: "otp_invalid",
        });
      case "verified":
        return { verified: true, phone };
    }
  }
}
