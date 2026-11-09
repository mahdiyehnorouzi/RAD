import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const BASE_SERVICE_NUMBER_URL =
  "https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber";
/**
 * A reachability check from the VPS got an HTTP response in about 14s, so
 * 10s aborted real sends. 20s covers that without a retry: a second POST
 * could deliver a second OTP.
 */
const REQUEST_TIMEOUT_MS = 20_000;

/**
 * Shared-number template send (`BaseServiceNumber`). A regular sender line
 * cannot deliver to numbers on the national telecom blacklist; this
 * endpoint can, once the template is approved in the Melipayamak panel.
 *
 * The approved template has one variable, the OTP, so `text` is that code
 * alone. Additional variables are not guessed. `bodyId` comes only from
 * `MELIPAYAMAK_BASE_SERVICE_BODY_ID`.
 *
 * Authentication stays username + password, matching the REST parameter
 * list and the rest of this client. Provider error 110 is documented as
 * "use an API key instead of a password" while the same method still lists
 * `password`. A 110 is a failed send; this client does not switch to an
 * API key on its own.
 *
 * Success is a 2xx response, `RetStatus === 1`, and `StrRetStatus` equal
 * to "OK" after trimming, compared case-insensitively. The provider PDF
 * example uses "Ok" while the prose says "OK". `Value` is the receipt id
 * and is never the OTP.
 */
function configuredSetting(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Approved template id. A blank, zero, or non-numeric value is unset. */
function templateBodyId(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || !/^[1-9]\d{0,17}$/.test(trimmed)) return undefined;
  return trimmed;
}

function namedField(record: Record<string, unknown>, name: string) {
  const key = Object.keys(record).find(
    (candidate) => candidate.toLowerCase() === name.toLowerCase(),
  );
  return key === undefined ? undefined : record[key];
}

type ProviderStatus = {
  retStatus?: number;
  strRetStatus?: string;
  receipt?: string;
};

function readProviderStatus(payload: unknown): ProviderStatus | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined;
  }
  const record = payload as Record<string, unknown>;
  const ret = namedField(record, "RetStatus");
  const str = namedField(record, "StrRetStatus");
  const value = namedField(record, "Value");
  let retStatus: number | undefined;
  if (typeof ret === "number" && Number.isInteger(ret)) retStatus = ret;
  else if (typeof ret === "string" && /^-?\d{1,6}$/.test(ret.trim())) {
    retStatus = Number(ret.trim());
  }
  const strRetStatus = typeof str === "string" ? str.trim() : undefined;
  let receipt: string | undefined;
  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    if (/^\d+$/.test(text)) receipt = text;
  }
  return { retStatus, strRetStatus, receipt };
}

function accepted(status: ProviderStatus) {
  return status.retStatus === 1 && status.strRetStatus?.toLowerCase() === "ok";
}

/**
 * Short status tokens only. Anything else is withheld so a body that
 * echoed the OTP, phone number, or credentials cannot reach the log.
 */
function diagnosticStrRetStatus(
  value: string | undefined,
  otp: string,
  phone: string,
) {
  if (!value) return "missing";
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(value)) return "unrecognized";
  if (value.includes(otp) || value.includes(phone)) return "withheld";
  return value;
}

/** Receipt ids are safe to record. The OTP and the phone number are not. */
function diagnosticReceipt(
  receipt: string | undefined,
  otp: string,
  phone: string,
) {
  if (!receipt || receipt === otp || receipt === phone) return undefined;
  return receipt;
}

function smsTracePath() {
  if (process.env.RAD_DISABLE_SMS_TRACE === "1") return undefined;
  const override = process.env.SMS_TRACE_FILE?.trim();
  if (override) return override;
  const cwd = process.cwd();
  const inApiDir = cwd.endsWith(`${sep}apps${sep}api`);
  return join(inApiDir ? cwd : join(cwd, "apps", "api"), "sms-send.log");
}

function appendSmsTrace(entry: string) {
  const file = smsTracePath();
  if (!file) return;
  try {
    mkdirSync(dirname(file), { recursive: true });
    appendFileSync(file, entry, { encoding: "utf8", mode: 0o600 });
  } catch (error) {
    const reason = error instanceof Error ? error.name : "Error";
    new Logger("MelipayamakService").warn(
      `SMS BaseServiceNumber trace could not be written (${reason})`,
    );
  }
}

@Injectable()
export class MelipayamakService {
  private readonly logger = new Logger(MelipayamakService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured() {
    return Boolean(
      configuredSetting(this.config.get<string>("MELIPAYAMAK_USERNAME")) &&
      configuredSetting(this.config.get<string>("MELIPAYAMAK_PASSWORD")) &&
      templateBodyId(
        this.config.get<string>("MELIPAYAMAK_BASE_SERVICE_BODY_ID"),
      ),
    );
  }

  /** Called once at boot (see `main.ts`), same as `MailService.logConfigurationStatus`. */
  logConfigurationStatus() {
    if (this.isConfigured()) {
      this.logger.log(
        "Melipayamak shared-number OTP is configured; SMS OTP is enabled.",
      );
      return;
    }
    this.logger.warn(
      "Melipayamak shared-number OTP is NOT configured " +
        "(MELIPAYAMAK_USERNAME/PASSWORD/BASE_SERVICE_BODY_ID missing or " +
        "the template id is not a positive integer). SMS OTP sign-in will " +
        "fail until these are set. MELIPAYAMAK_SENDER is not used.",
    );
  }

  /**
   * `to`: one Iranian mobile number, digits only. `code`: the OTP
   * `OtpService` generated. Sent as the template's only variable.
   */
  async sendOtp(to: string, code: string): Promise<void> {
    const username = configuredSetting(
      this.config.get<string>("MELIPAYAMAK_USERNAME"),
    );
    const password = configuredSetting(
      this.config.get<string>("MELIPAYAMAK_PASSWORD"),
    );
    const bodyId = templateBodyId(
      this.config.get<string>("MELIPAYAMAK_BASE_SERVICE_BODY_ID"),
    );
    if (!username || !password) {
      throw new InternalServerErrorException({
        message:
          "ارسال پیامک پیکربندی نشده است. MELIPAYAMAK_USERNAME و MELIPAYAMAK_PASSWORD را در apps/api/.env تنظیم کنید.",
        code: "melipayamak_not_configured",
      });
    }
    if (!bodyId) {
      throw new InternalServerErrorException({
        message:
          "ارسال پیامک پیکربندی نشده است. MELIPAYAMAK_BASE_SERVICE_BODY_ID را با شناسه قالب تأییدشده تنظیم کنید.",
        code: "melipayamak_template_not_configured",
      });
    }

    const body = new URLSearchParams({
      username,
      password,
      text: code,
      to,
      bodyId,
    });

    let response: Response;
    try {
      response = await fetch(BASE_SERVICE_NUMBER_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.name : "Error";
      appendSmsTrace(
        [
          `===== ${new Date().toISOString()} =====`,
          `POST BaseServiceNumber bodyId=${bodyId}`,
          "no HTTP response",
          `error ${reason}`,
          "",
        ].join("\n"),
      );
      this.logger.error(
        `Melipayamak BaseServiceNumber request failed: ${reason}`,
      );
      throw new InternalServerErrorException(
        "ارسال پیامک ناموفق بود. دوباره تلاش کنید.",
      );
    }

    let payload: unknown;
    try {
      payload = JSON.parse((await response.text()).trim());
    } catch {
      payload = undefined;
    }
    const status = readProviderStatus(payload);
    const receipt = diagnosticReceipt(status?.receipt, code, to);
    appendSmsTrace(
      [
        `===== ${new Date().toISOString()} =====`,
        `POST BaseServiceNumber bodyId=${bodyId}`,
        `HTTP ${response.status}`,
        `RetStatus ${status?.retStatus ?? "missing"}`,
        `StrRetStatus ${diagnosticStrRetStatus(status?.strRetStatus, code, to)}`,
        `receipt ${receipt ?? "withheld"}`,
        "",
      ].join("\n"),
    );

    if (status?.retStatus === 110 || status?.retStatus === -110) {
      this.logger.warn(
        "Melipayamak BaseServiceNumber returned 110. The provider documents this as requiring an API key instead of a password, while the REST parameter list still names password. This client still sends MELIPAYAMAK_PASSWORD.",
      );
    }

    if (!response.ok || !status || !accepted(status)) {
      const retStatus =
        status?.retStatus !== undefined && Math.abs(status.retStatus) <= 9999
          ? String(status.retStatus)
          : "unrecognized";
      this.logger.warn(
        `Melipayamak BaseServiceNumber was not accepted (HTTP ${response.status}, RetStatus ${retStatus}, StrRetStatus ${diagnosticStrRetStatus(status?.strRetStatus, code, to)})`,
      );
      throw new InternalServerErrorException(
        "ارسال پیامک ناموفق بود. دوباره تلاش کنید.",
      );
    }

    this.logger.log(
      `Melipayamak BaseServiceNumber accepted (receipt ${receipt ?? "withheld"})`,
    );
  }
}
