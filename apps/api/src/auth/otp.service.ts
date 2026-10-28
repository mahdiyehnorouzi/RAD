import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MoreThan, Repository } from "typeorm";
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

  /** Marks the code consumed on success. Returns only a boolean — no session is opened here. */
  async verifyCode(rawPhone: string, rawCode: string) {
    const phone = this.requirePhone(rawPhone);
    const code = rawCode.trim();

    const record = await this.codes.findOne({
      where: { phone, expiresAt: MoreThan(new Date()) },
      order: { createdAt: "DESC" },
    });
    if (!record || record.consumedAt) {
      throw new NotFoundException({
        message: "کد ورود نامعتبر یا منقضی شده است.",
        code: "otp_expired",
      });
    }
    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      throw new BadRequestException({
        message: "تعداد تلاش‌های مجاز تمام شده؛ کد جدید درخواست کنید.",
        code: "otp_too_many_attempts",
      });
    }

    if (hashVerificationCode(code) !== record.codeHash) {
      await this.codes.update(
        { id: record.id },
        { attempts: record.attempts + 1 },
      );
      throw new BadRequestException({
        message: "کد وارد شده درست نیست.",
        code: "otp_invalid",
      });
    }

    await this.codes.update({ id: record.id }, { consumedAt: new Date() });
    return { verified: true, phone };
  }
}
