import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  Optional,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

type TransportFactory = (options: SMTPTransport.Options) => Transporter;

/**
 * Injection token for `createTransport`. A plain `TransportFactory`-typed
 * constructor param has no runtime type Nest can resolve (TS erases the
 * function-type alias to `Function` in emitted `design:paramtypes`
 * metadata) — Nest's DI container tried to inject a `Function` provider
 * that no module registers, throwing `UnknownDependenciesException` on
 * boot. An explicit token sidesteps that; `@Optional()` lets the default
 * (real nodemailer) apply whenever nothing overrides the token, which is
 * every environment except tests.
 */
export const MAIL_TRANSPORT_FACTORY = Symbol("MAIL_TRANSPORT_FACTORY");

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(
    // Explicit @Inject(ConfigService) rather than relying on the reflected
    // type: this repo's test runner (`tsx --test`, see AGENTS.md) transpiles
    // via esbuild, which does not implement `emitDecoratorMetadata` — under
    // it, implicit type-based params silently resolve to `undefined`
    // instead of throwing, which is exactly the class of bug fixed below.
    // Explicit tokens make DI resolution runner-independent, so a real
    // Nest DI container can be exercised in tests (see mail.module.spec.ts)
    // the same way production (`nest build`) already resolves it correctly.
    @Inject(ConfigService) private readonly config: ConfigService,
    @Optional()
    @Inject(MAIL_TRANSPORT_FACTORY)
    private readonly createTransport: TransportFactory = nodemailer.createTransport.bind(
      nodemailer,
    ),
  ) {}

  private getTransporter() {
    if (this.transporter) return this.transporter;

    const host = this.config.get<string>("SMTP_HOST");
    const user = this.config.get<string>("SMTP_USER");
    const pass = this.config.get<string>("SMTP_PASS");
    if (!host || !user || !pass) {
      throw new InternalServerErrorException(
        "ارسال ایمیل پیکربندی نشده است. SMTP_HOST، SMTP_USER و SMTP_PASS را در apps/api/.env تنظیم کنید.",
      );
    }

    this.transporter = this.createTransport({
      host,
      port: Number(this.config.get<string>("SMTP_PORT") ?? 587),
      secure: this.config.get<string>("SMTP_SECURE") === "true",
      auth: { user, pass },
    });
    return this.transporter;
  }

  isConfigured() {
    return Boolean(
      this.config.get<string>("SMTP_HOST") &&
      this.config.get<string>("SMTP_USER") &&
      this.config.get<string>("SMTP_PASS"),
    );
  }

  /**
   * Called once at boot (see `main.ts`). Never throws — missing SMTP config
   * shouldn't crash the API, since plenty of endpoints don't need mail —
   * but it puts a loud, unambiguous line in the boot log instead of the
   * previous behavior of only discovering this the moment a user first
   * requests a password reset or an admin invite.
   */
  logConfigurationStatus() {
    if (this.isConfigured()) {
      this.logger.log("SMTP is configured; transactional email is enabled.");
      return;
    }
    this.logger.warn(
      "SMTP is NOT configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing). " +
        "Password reset and admin invitation emails will fail until these are set.",
    );
  }

  private from() {
    return (
      this.config.get<string>("SMTP_FROM") ??
      `RAD Studio <${this.config.get<string>("SMTP_USER")}>`
    );
  }

  /** Payment verified by RAD; order is confirmed. Throws when SMTP fails. */
  async sendOrderConfirmed(
    to: string,
    order: { id: string; name: string; total: number },
  ) {
    const total = new Intl.NumberFormat("fa-IR").format(order.total);
    const text = [
      `${order.name} عزیز، سلام`,
      "",
      `پرداخت سفارش ${order.id} به مبلغ ${total} تومان تأیید شد و سفارش شما ثبت نهایی شد.`,
      "اثر برای شما کنار گذاشته شده و به‌زودی بسته‌بندی و ارسال می‌شود.",
      "",
      "— استودیو رَد",
    ].join("\n");
    await this.getTransporter().sendMail({
      from: this.from(),
      to,
      subject: `سفارش ${order.id} تأیید شد — رَد`,
      text,
    });
  }

  /** RAD refused the receipt; the work went back on sale. */
  async sendPaymentRejected(
    to: string,
    order: { id: string; name: string; reason: string },
  ) {
    const text = [
      `${order.name} عزیز، سلام`,
      "",
      `پرداخت سفارش ${order.id} تأیید نشد.`,
      `دلیل: ${order.reason}`,
      "",
      "اگر مبلغی واریز کرده‌اید، برای پیگیری بازگشت وجه با پشتیبانی رَد تماس بگیرید.",
      "",
      "— استودیو رَد",
    ].join("\n");
    await this.getTransporter().sendMail({
      from: this.from(),
      to,
      subject: `پرداخت سفارش ${order.id} تأیید نشد — رَد`,
      text,
    });
  }

  async sendPasswordResetCode(to: string, code: string) {
    const from = this.from();
    const subject = "کد بازیابی رمز عبور — دفتر کوره رَد";
    const text = [
      "سلام،",
      "",
      `کد بازیابی رمز عبور شما: ${code}`,
      "",
      "این کد تا ۱۵ دقیقه معتبر است.",
      "اگر این درخواست را شما نداده‌اید، این ایمیل را نادیده بگیرید.",
      "",
      "— استودیو رَد",
    ].join("\n");
    const html = `
      <div style="font-family:Tahoma,sans-serif;line-height:1.8;color:#14251f">
        <p>سلام،</p>
        <p>کد بازیابی رمز عبور شما:</p>
        <p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p>
        <p>این کد تا ۱۵ دقیقه معتبر است.</p>
        <p style="color:#72766f">اگر این درخواست را شما نداده‌اید، این ایمیل را نادیده بگیرید.</p>
        <p>— استودیو رَد</p>
      </div>
    `;

    try {
      await this.getTransporter().sendMail({ from, to, subject, text, html });
    } catch (error) {
      this.logger.error("Failed to send password reset email", error);
      throw new InternalServerErrorException(
        "ارسال ایمیل ناموفق بود. تنظیمات SMTP را بررسی کنید.",
      );
    }
  }

  /** New staff invite: a one-time code to set their own password. Never carries a plaintext password. */
  async sendAdminInvite(to: string, code: string) {
    const from = this.from();
    const subject = "دعوت به دفتر کوره رَد";
    const text = [
      "سلام،",
      "",
      "برای شما دسترسی به دفتر کوره رَد ایجاد شده است.",
      `کد فعال‌سازی حساب شما: ${code}`,
      "",
      "برای تنظیم رمز عبور، از همین کد در صفحهٔ «تنظیم رمز عبور» استفاده کنید.",
      "این کد تا ۷ روز معتبر است.",
      "اگر این دعوت را انتظار نداشتید، این ایمیل را نادیده بگیرید.",
      "",
      "— استودیو رَد",
    ].join("\n");
    const html = `
      <div style="font-family:Tahoma,sans-serif;line-height:1.8;color:#14251f">
        <p>سلام،</p>
        <p>برای شما دسترسی به دفتر کوره رَد ایجاد شده است.</p>
        <p>کد فعال‌سازی حساب شما:</p>
        <p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p>
        <p>برای تنظیم رمز عبور، از همین کد در صفحهٔ «تنظیم رمز عبور» استفاده کنید.</p>
        <p>این کد تا ۷ روز معتبر است.</p>
        <p style="color:#72766f">اگر این دعوت را انتظار نداشتید، این ایمیل را نادیده بگیرید.</p>
        <p>— استودیو رَد</p>
      </div>
    `;

    try {
      await this.getTransporter().sendMail({ from, to, subject, text, html });
    } catch (error) {
      this.logger.error("Failed to send admin invitation email", error);
      throw new InternalServerErrorException(
        "ارسال ایمیل دعوت ناموفق بود. تنظیمات SMTP را بررسی کنید.",
      );
    }
  }
}
