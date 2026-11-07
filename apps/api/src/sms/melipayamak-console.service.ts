import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Sends a single plain-text SMS via Melipayamak's Console "send/simple"
 * REST API (`POST https://console.melipayamak.com/api/send/simple/{TOKEN}`,
 * JSON body `{ from, to, text }`) — a different Melipayamak product from
 * `MelipayamakService`'s `SendOtp` API (username/password auth, used only
 * by `OtpService` for SMS OTP sign-in). This one is token-based and sends
 * arbitrary text, not a fixed OTP template.
 *
 * Deliberately NOT wired into order-status notifications or OTP sign-in
 * yet: the statuses to notify on, timing, message count, retry policy,
 * and duplicate-send prevention are all still undecided, and the OTP flow
 * already has its own tested provider (`MelipayamakService`) that this
 * must not be swapped in for — see this feature's task notes. This class
 * is a general-purpose send primitive only; nothing in the API calls it
 * yet.
 *
 * Mirrors `MelipayamakService`'s isConfigured()/disabled-until-configured
 * pattern: missing credentials never crash the API, but every call fails
 * loud and coded until `MELIPAYAMAK_CONSOLE_API_TOKEN` and
 * `MELIPAYAMAK_CONSOLE_SENDER` are set (see `apps/api/.env.example`).
 *
 * Never logs the token, the full endpoint URL (it embeds the token), the
 * message body, or the recipient's phone number — only generic
 * success/failure and the HTTP status.
 */
@Injectable()
export class MelipayamakConsoleService {
  private readonly logger = new Logger(MelipayamakConsoleService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured() {
    return Boolean(
      this.config.get<string>("MELIPAYAMAK_CONSOLE_API_TOKEN") &&
      this.config.get<string>("MELIPAYAMAK_CONSOLE_SENDER"),
    );
  }

  /** Called once at boot (see `main.ts`), same as `MailService.logConfigurationStatus`. */
  logConfigurationStatus() {
    if (this.isConfigured()) {
      this.logger.log(
        "Melipayamak Console is configured; generic SMS sending is enabled.",
      );
      return;
    }
    this.logger.warn(
      "Melipayamak Console is NOT configured (MELIPAYAMAK_CONSOLE_API_TOKEN/" +
        "MELIPAYAMAK_CONSOLE_SENDER missing). Generic SMS sending will fail " +
        "until these are set.",
    );
  }

  /** `to`: an Iranian mobile number. `text`: the message body, provider-length-limited. */
  async sendSimple(to: string, text: string): Promise<void> {
    const token = this.config.get<string>("MELIPAYAMAK_CONSOLE_API_TOKEN");
    const from = this.config.get<string>("MELIPAYAMAK_CONSOLE_SENDER");
    if (!token || !from) {
      throw new InternalServerErrorException({
        message:
          "ارسال پیامک پیکربندی نشده است. MELIPAYAMAK_CONSOLE_API_TOKEN و MELIPAYAMAK_CONSOLE_SENDER را در apps/api/.env تنظیم کنید.",
        code: "melipayamak_console_not_configured",
      });
    }

    let response: Response;
    try {
      response = await fetch(
        `https://console.melipayamak.com/api/send/simple/${token}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ from, to, text }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      );
    } catch (error) {
      this.logger.error(
        `Melipayamak Console send/simple request failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new InternalServerErrorException(
        "ارسال پیامک ناموفق بود. دوباره تلاش کنید.",
      );
    }

    if (!response.ok) {
      this.logger.warn(
        `Melipayamak Console send/simple returned HTTP ${response.status}`,
      );
      throw new InternalServerErrorException(
        "ارسال پیامک ناموفق بود. دوباره تلاش کنید.",
      );
    }

    // ASSUMED success shape: `{ "recId": <number> }`. This has not been
    // confirmed against this endpoint's own documentation or a live
    // account — see this feature's task notes. SendOtp (the OTP provider)
    // uses a different body (`RetStatus` / `StrRetStatus`) and is not a
    // template for this one. Any other body shape is treated as a failure
    // rather than guessed at, since a 2xx HTTP status alone is not proof
    // the message was accepted. Revisit once the real response shape is
    // confirmed.
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      this.logger.warn(
        "Melipayamak Console send/simple returned a non-JSON 2xx body",
      );
      throw new InternalServerErrorException(
        "ارسال پیامک ناموفق بود. دوباره تلاش کنید.",
      );
    }

    const recId = (body as { recId?: unknown } | null)?.recId;
    if (typeof recId !== "number" || !Number.isFinite(recId) || recId <= 0) {
      this.logger.warn(
        "Melipayamak Console send/simple did not return a valid recId",
      );
      throw new InternalServerErrorException(
        "ارسال پیامک ناموفق بود. دوباره تلاش کنید.",
      );
    }
  }
}
