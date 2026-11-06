import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const SEND_OTP_URL = "https://rest.payamak-panel.com/api/SendSMS/SendOtp";
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Documented `SendOtp` return codes
 * (https://www.melipayamak.com/api/sendotp/,
 * https://api.payamak-panel.com/post/Send.asmx?op=SendOtp). A successful
 * send returns a positive `recId` (a number, no documented upper bound);
 * every one of these is a documented *failure* code, not a `recId` — a
 * small positive integer like `2` or `16` must never be mistaken for a
 * tiny recId. Codes are checked as the exact string the API returns.
 */
const KNOWN_ERROR_CODES: ReadonlySet<string> = new Set([
  "0", // wrong username or password
  "2", // insufficient credit
  "3", // daily send limit reached
  "4", // send volume limit reached
  "5", // sender number invalid
  "6", // system under update
  "7", // text contains a filtered word
  "9", // sending from a public line is not allowed via web service
  "10", // user not active
  "11", // not sent
  "12", // user documents incomplete
  "14", // text contains a link
  "15", // sending to more than one number is not allowed for this method
  "16", // recipient not found
  "17", // SMS text is empty
  "18", // recipient number invalid
  "35", // recipient number is on the blacklist
  "111", // requester is invalid
  "-108", // IP blocked after repeated failed API attempts
  "-109", // an allowed IP must be configured for this account
  "-110", // an ApiKey must be used instead of a password
]);

/**
 * A positive integer not in `KNOWN_ERROR_CODES` is treated as a `recId`
 * (success); anything else — a documented error code, a negative number
 * not in that list, or a non-numeric/malformed body — is a failure. Never
 * silently treated as success just because it parses as *some* number.
 */
function isSuccessfulReturnValue(value: string) {
  return /^\d+$/.test(value) && !KNOWN_ERROR_CODES.has(value);
}

/**
 * The REST wrapper (`rest.payamak-panel.com`) actually answers with a JSON
 * body carrying the return value under a `Value` field (confirmed against
 * production traffic — every real send was previously logged as "an
 * unrecognized, non-success value" because this parser only handled bare
 * text/XML, never JSON). Two other shapes stay supported as fallbacks: the
 * documented `<string xmlns="...">VALUE</string>` XML wrapper (the ASMX
 * host's plain GET/POST shape) and bare text (the vendor's own PHP sample
 * shows no response body, so this was the previous best guess). Checking
 * JSON first, then XML, then falling back to the raw trimmed body, means a
 * provider-side response-format change doesn't turn into "every OTP send
 * suddenly fails to parse" — whichever shape comes back, the same
 * documented-return-code classification below still applies to whatever
 * string this extracts.
 */
function extractReturnValue(body: string): string {
  const trimmed = body.trim();

  const json = tryParseJson(trimmed);
  if (json && typeof json === "object" && !Array.isArray(json)) {
    const valueKey = Object.keys(json).find(
      (key) => key.toLowerCase() === "value",
    );
    if (valueKey) {
      const value = (json as Record<string, unknown>)[valueKey];
      if (typeof value === "string" || typeof value === "number") {
        return String(value).trim();
      }
    }
  }

  const xmlMatch = trimmed.match(/<string[^>]*>([^<]*)<\/string>/i);
  return (xmlMatch ? xmlMatch[1] : trimmed).trim();
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * Sends a single OTP SMS via Melipayamak's legacy `SendOtp` web service
 * (REST form-encoded wrapper documented at
 * https://www.melipayamak.com/api/sendotp/, same method as the ASMX
 * endpoint at https://api.payamak-panel.com/post/Send.asmx?op=SendOtp).
 * RAD generates the OTP code itself (`OtpService`) and passes it as
 * `code`; this service never generates or expects a provider-generated
 * code — unlike Melipayamak's Console "send/otp" product, this legacy
 * method only delivers a code RAD already decided on.
 *
 * The request is `application/x-www-form-urlencoded` — the vendor's own
 * sample posts with `http_build_query`, not JSON; see this method's own
 * documentation before assuming otherwise for any change here. The
 * *response*, unlike the request, is JSON on the REST wrapper used here
 * (see `extractReturnValue`) — don't conflate the two.
 *
 * Mirrors `MailService`'s isConfigured()/disabled-until-configured
 * pattern: missing credentials never crash the API, but every call fails
 * loud and coded until `MELIPAYAMAK_USERNAME`/`MELIPAYAMAK_PASSWORD`/
 * `MELIPAYAMAK_SENDER` are set (see `apps/api/.env.example`). Separate
 * from, and does not read, `MELIPAYAMAK_CONSOLE_API_TOKEN`/
 * `MELIPAYAMAK_CONSOLE_SENDER` — those belong to the unrelated Console
 * "send/simple" product (`MelipayamakConsoleService`), a different
 * Melipayamak account/auth scheme.
 *
 * Never logs the username, password, OTP code, or recipient phone number
 * — on failure, only the mapped, generic error code/classification is
 * logged, never the raw response body (which could, per the documented
 * shapes above, echo back request data).
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

  /**
   * `to`: the user's submitted Iranian mobile number, digits only, e.g.
   * "09121234567" — always the caller's argument, never a fixed/env value.
   * `code`: the OTP RAD generated for this request (see
   * `OtpService.requestCode`/`generateVerificationCode`) — always
   * generated per request, never a fixed/env value.
   */
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

    const body = new URLSearchParams({ username, password, to, from, code });

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
        `Melipayamak SendOtp request failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new InternalServerErrorException(
        "ارسال پیامک ناموفق بود. دوباره تلاش کنید.",
      );
    }

    if (!response.ok) {
      this.logger.warn(`Melipayamak SendOtp returned HTTP ${response.status}`);
      throw new InternalServerErrorException(
        "ارسال پیامک ناموفق بود. دوباره تلاش کنید.",
      );
    }

    let returnValue: string;
    try {
      returnValue = extractReturnValue(await response.text());
    } catch {
      this.logger.warn("Melipayamak SendOtp returned an unreadable body");
      throw new InternalServerErrorException(
        "ارسال پیامک ناموفق بود. دوباره تلاش کنید.",
      );
    }

    // The REST endpoint's own success/failure signal is this return value,
    // not the HTTP status — a 200 with a documented error code in the body
    // is the documented failure shape, not an exception. Never logs the
    // raw value itself (it's still provider response content); only the
    // fact that it was unsuccessful and, if recognized, which documented
    // code it was.
    if (!isSuccessfulReturnValue(returnValue)) {
      this.logger.warn(
        KNOWN_ERROR_CODES.has(returnValue)
          ? `Melipayamak SendOtp rejected the request (documented error code ${returnValue})`
          : "Melipayamak SendOtp returned an unrecognized, non-success value",
      );
      throw new InternalServerErrorException(
        "ارسال پیامک ناموفق بود. دوباره تلاش کنید.",
      );
    }
  }
}
