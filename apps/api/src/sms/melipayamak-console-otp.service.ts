import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Sends a single OTP SMS via Melipayamak's Console "send/otp" REST API
 * (`POST https://console.melipayamak.com/api/send/otp/{TOKEN}`, JSON body
 * `{ to }`) — replaces the legacy username/password `MelipayamakService`
 * (`SendOtp`) as the OTP sign-in provider. This endpoint generates and
 * returns the code itself; the caller must use that returned code as the
 * OTP, never generate a separate one, since the two could diverge.
 *
 * Mirrors `MelipayamakConsoleService`'s isConfigured()/disabled-until-
 * configured pattern: missing config never crashes the API, but every call
 * fails loud and coded until `MELIPAYAMAK_CONSOLE_API_TOKEN` is set (see
 * `apps/api/.env.example`). Unlike the "send/simple" endpoint, this one
 * needs no sender line — the OTP template is provider-side.
 *
 * Never logs the token, the full endpoint URL (it embeds the token), or
 * the recipient's phone number — and never logs the returned code either,
 * since that is the live, usable OTP for a real phone number.
 *
 * ASSUMED response shape: a 2xx JSON body `{ "code": ..., "status": ... }`.
 * This has not been confirmed against this endpoint's own documentation or
 * a live account (see this feature's task notes). `code` is kept and
 * returned as a *string*, never parsed as a number, so a leading zero in
 * the provider's code is never silently dropped. For `status`, the
 * documented contract of what value means "sent" vs. "failed" was not
 * available; rather than guess which exact success token to require (and
 * risk rejecting real successes), this treats the call as successful only
 * when the HTTP response is 2xx AND a non-empty, digits-only `code` is
 * present AND `status`, if present, does not look like a failure (falsy,
 * or a string containing an error-ish keyword). Any other shape is treated
 * as a failure, never silently treated as a success. Revisit this check
 * once the real contract for `status` is confirmed.
 */
@Injectable()
export class MelipayamakConsoleOtpService {
  private readonly logger = new Logger(MelipayamakConsoleOtpService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured() {
    return Boolean(this.config.get<string>("MELIPAYAMAK_CONSOLE_API_TOKEN"));
  }

  /** Called once at boot (see `main.ts`), same as `MailService.logConfigurationStatus`. */
  logConfigurationStatus() {
    if (this.isConfigured()) {
      this.logger.log(
        "Melipayamak Console OTP is configured; SMS OTP sign-in is enabled.",
      );
      return;
    }
    this.logger.warn(
      "Melipayamak Console OTP is NOT configured " +
        "(MELIPAYAMAK_CONSOLE_API_TOKEN missing). SMS OTP sign-in will fail " +
        "until it is set.",
    );
  }

  /**
   * `to`: an Iranian mobile number, digits only, e.g. "09121234567".
   * Returns the OTP code the provider generated and sent, as a string.
   */
  async sendOtp(to: string): Promise<string> {
    const token = this.config.get<string>("MELIPAYAMAK_CONSOLE_API_TOKEN");
    if (!token) {
      throw new InternalServerErrorException({
        message:
          "ارسال پیامک پیکربندی نشده است. MELIPAYAMAK_CONSOLE_API_TOKEN را در apps/api/.env تنظیم کنید.",
        code: "melipayamak_console_not_configured",
      });
    }

    let response: Response;
    try {
      response = await fetch(
        `https://console.melipayamak.com/api/send/otp/${token}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ to }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      );
    } catch (error) {
      this.logger.error(
        `Melipayamak Console send/otp request failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new InternalServerErrorException(
        "ارسال پیامک ناموفق بود. دوباره تلاش کنید.",
      );
    }

    if (!response.ok) {
      this.logger.warn(
        `Melipayamak Console send/otp returned HTTP ${response.status}`,
      );
      throw new InternalServerErrorException(
        "ارسال پیامک ناموفق بود. دوباره تلاش کنید.",
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      this.logger.warn(
        "Melipayamak Console send/otp returned a non-JSON 2xx body",
      );
      throw new InternalServerErrorException(
        "ارسال پیامک ناموفق بود. دوباره تلاش کنید.",
      );
    }

    const { code: rawCode, status } = (body ?? {}) as {
      code?: unknown;
      status?: unknown;
    };

    if (looksLikeFailureStatus(status)) {
      this.logger.warn(
        "Melipayamak Console send/otp reported a failure status",
      );
      throw new InternalServerErrorException(
        "ارسال پیامک ناموفق بود. دوباره تلاش کنید.",
      );
    }

    const code =
      typeof rawCode === "string"
        ? rawCode.trim()
        : typeof rawCode === "number" && Number.isFinite(rawCode)
          ? String(rawCode)
          : "";
    if (!/^\d+$/.test(code)) {
      this.logger.warn(
        "Melipayamak Console send/otp did not return a usable code",
      );
      throw new InternalServerErrorException(
        "ارسال پیامک ناموفق بود. دوباره تلاش کنید.",
      );
    }

    return code;
  }
}

const FAILURE_KEYWORDS = [
  "error",
  "fail",
  "invalid",
  "خطا",
  "نامعتبر",
  "ناموفق",
];

/** `status` missing is NOT a failure signal by itself (the documented shape of a success `status` was not confirmed) — only an explicitly falsy or error-looking value is. */
function looksLikeFailureStatus(status: unknown): boolean {
  if (status === undefined) return false;
  if (status === null || status === false || status === 0) return true;
  if (typeof status === "string") {
    const normalized = status.trim().toLowerCase();
    if (normalized === "") return true;
    return FAILURE_KEYWORDS.some((keyword) => normalized.includes(keyword));
  }
  if (typeof status === "number") return status < 0;
  return false;
}
