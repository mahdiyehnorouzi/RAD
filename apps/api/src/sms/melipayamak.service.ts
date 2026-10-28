import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const SEND_OTP_URL = "https://rest.payamak-panel.com/api/SendSMS/SendOtp";
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Melipayamak's SendOtp REST endpoint returns `ReturnValue` as a plain
 * string: either a positive `recId` (success) or one of a fixed set of
 * negative/zero error codes documented at
 * https://api.payamak-panel.com — `0` and negative codes are failures,
 * never a valid receipt id.
 */
function isSuccessfulReturnValue(value: string) {
  return /^\d+$/.test(value.trim()) && value.trim() !== "0";
}

/**
 * Sends a single OTP SMS via Melipayamak's `SendOtp` REST API. Mirrors
 * `MailService`'s isConfigured()/disabled-until-configured pattern: missing
 * credentials never crash the API, but every call fails loud and coded
 * until `MELIPAYAMAK_USERNAME`/`MELIPAYAMAK_PASSWORD`/`MELIPAYAMAK_SENDER`
 * are set (see `apps/api/.env.example`).
 */
@Injectable()
export class MelipayamakService {
  private readonly logger = new Logger(MelipayamakService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured() {
    return Boolean(
      this.config.get<string>("MELIPAYAMAK_USERNAME") &&
        this.config.get<string>("MELIPAYAMAK_PASSWORD") &&
        this.config.get<string>("MELIPAYAMAK_SENDER"),
    );
  }

  /** Called once at boot (see `main.ts`), same as `MailService.logConfigurationStatus`. */
  logConfigurationStatus() {
    if (this.isConfigured()) {
      this.logger.log("Melipayamak is configured; SMS OTP is enabled.");
      return;
    }
    this.logger.warn(
      "Melipayamak is NOT configured (MELIPAYAMAK_USERNAME/PASSWORD/SENDER " +
        "missing). SMS OTP sign-in will fail until these are set.",
    );
  }

  /** `to`: an Iranian mobile number, digits only, e.g. "09121234567". `code`: 6 digits. */
  async sendOtp(to: string, code: string): Promise<void> {
    const username = this.config.get<string>("MELIPAYAMAK_USERNAME");
    const password = this.config.get<string>("MELIPAYAMAK_PASSWORD");
    const from = this.config.get<string>("MELIPAYAMAK_SENDER");
    if (!username || !password || !from) {
      throw new InternalServerErrorException({
        message:
          "ارسال پیامک پیکربندی نشده است. MELIPAYAMAK_USERNAME، MELIPAYAMAK_PASSWORD و MELIPAYAMAK_SENDER را در apps/api/.env تنظیم کنید.",
        code: "melipayamak_not_configured",
      });
    }

    const body = new URLSearchParams({
      username,
      password,
      to,
      from,
      code,
    });

    let response: Response;
    try {
      response = await fetch(SEND_OTP_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.error(
        `Melipayamak SendOtp request failed: ${error instanceof Error ? error.message : error}`,
      );
      throw new InternalServerErrorException(
        "ارسال پیامک ناموفق بود. دوباره تلاش کنید.",
      );
    }

    const text = (await response.text()).trim();
    // The REST endpoint's own success/failure signal is the body's
    // `ReturnValue`, not the HTTP status — a 200 with an error code in the
    // body is the documented failure shape, not an exception.
    if (!response.ok || !isSuccessfulReturnValue(text)) {
      this.logger.warn(
        `Melipayamak SendOtp returned a non-success value: "${text}" (HTTP ${response.status})`,
      );
      throw new InternalServerErrorException(
        "ارسال پیامک ناموفق بود. دوباره تلاش کنید.",
      );
    }
  }
}
