import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

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

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(this.config.get<string>("SMTP_PORT") ?? 587),
      secure: this.config.get<string>("SMTP_SECURE") === "true",
      auth: { user, pass },
    });
    return this.transporter;
  }

  async sendPasswordResetCode(to: string, code: string) {
    const from =
      this.config.get<string>("SMTP_FROM") ??
      `RAD Studio <${this.config.get<string>("SMTP_USER")}>`;
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
}
