import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, MoreThan, Repository } from "typeorm";
import { OtpCode, OtpRequestLog } from "../database/entities";
import { MelipayamakService } from "../sms/melipayamak.service";
import { normalizeIranianMobile } from "../sms/phone";
import {
  generateVerificationCode,
  hashVerificationCode,
} from "./reset-token.util";

/** Sign-in codes stay valid for exactly 3 minutes. `verifyCode` rejects `expiresAt <= now`. */
const OTP_TTL_MS = 3 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

// Phone-keyed send rate limit, on top of (never instead of) the resend
// cooldown above: the cooldown only stops *rapid-fire* resends, not an
// attacker who waits out each 60s cooldown and rotates source IPs to dodge
// the controller's IP-based `@Throttle` — that still lets them run up the
// SMS provider bill against one phone indefinitely. Five sends per ten
// minutes is generous for a real user (who hits the 60s cooldown first
// anyway) but caps the worst case at 30 SMS/hour/phone.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

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
    @InjectRepository(OtpRequestLog)
    private readonly requestLogs: Repository<OtpRequestLog>,
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

    // Cooldown + rate-limit checks and reserving the new code all happen
    // inside one transaction, serialized per phone via a Postgres advisory
    // lock (`pg_advisory_xact_lock`, auto-released on commit/rollback) —
    // the same reason `verifyCode` uses a row lock: without it, two
    // concurrent requests for the same phone can each read "0 recent sends"
    // before either one's insert commits, so both pass both checks and
    // both pages the SMS provider, overshooting the cap. There's no
    // existing row to lock a fresh phone's checks against, which is what
    // the advisory lock (keyed by the phone string, not any row) is for.
    const { code, tokenHash, expiresAt } = generateVerificationCode(OTP_TTL_MS);
    await this.dataSource.transaction(async (manager: EntityManager) => {
      await manager.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        phone,
      ]);

      const codes = manager.getRepository(OtpCode);
      const requestLogs = manager.getRepository(OtpRequestLog);

      const recent = await codes.findOne({
        where: {
          phone,
          createdAt: MoreThan(new Date(Date.now() - RESEND_COOLDOWN_MS)),
        },
        order: { createdAt: "DESC" },
      });
      if (recent) {
        throw new BadRequestException({
          message:
            "کد ورود به‌تازگی ارسال شده؛ کمی صبر کنید و دوباره تلاش کنید.",
          code: "otp_cooldown",
        });
      }

      // Unlike `OtpCode` (replaced on every request so verification only
      // ever sees one active code), `OtpRequestLog` rows are never deleted
      // — that history is exactly what this count needs, and is also why
      // it lives in its own table rather than being derived from `codes`.
      const sentInWindow = await requestLogs.count({
        where: {
          phone,
          createdAt: MoreThan(new Date(Date.now() - RATE_LIMIT_WINDOW_MS)),
        },
      });
      if (sentInWindow >= RATE_LIMIT_MAX_REQUESTS) {
        // Same generic shape as every other OTP error here: the phone's
        // existence/account status is never distinguishable from the
        // response, rate-limited or not.
        throw new BadRequestException({
          message:
            "تعداد درخواست‌های کد برای این شماره بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید.",
          code: "otp_rate_limited",
        });
      }

      // Logged before the SMS call, inside the same locked transaction, so
      // it counts against the limit whether or not the send below actually
      // succeeds — an attacker forcing provider failures (or hitting real
      // ones) doesn't get free, uncounted attempts at this gate.
      await requestLogs.save(requestLogs.create({ phone }));

      // One active code per phone: an old, unconsumed code from a prior
      // request must never still verify once a newer one has been sent.
      await codes.delete({ phone });
      await codes.save(codes.create({ phone, codeHash: tokenHash, expiresAt }));
    });

    try {
      await this.sms.sendOtp(phone, code);
    } catch (error) {
      // Don't leave an unusable, unreachable code sitting active: the next
      // request should be a normal retry, not blocked by the cooldown for
      // a send that never actually reached the phone. The `OtpRequestLog`
      // row stays — the attempt still counts toward the rate limit even
      // though the cooldown clears.
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
