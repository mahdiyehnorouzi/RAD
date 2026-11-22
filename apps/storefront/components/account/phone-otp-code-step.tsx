"use client";

import "./phone-otp-code-step.css";
import { useLocale } from "@/components/i18n";
import { Button } from "@/components/ui/button-link";
import { formatIranMobileDraft } from "@/lib/phone/iran-mobile";
import { OtpCodeInput } from "./otp-code-input";

/** The account page's code step: six cells, confirm, change-number, resend. */
export function PhoneOtpCodeStep({
  id,
  sentPhone,
  code,
  busy,
  invalid,
  cooldown,
  onChange,
  onComplete,
  onVerify,
  /** Account login submits its own form. Checkout must not submit the order. */
  submit = false,
  onChangePhone,
  onResend,
  className = "",
  actionClassName = "",
}: {
  id: string;
  sentPhone: string;
  code: string;
  busy: boolean;
  invalid: boolean;
  cooldown: number;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  onVerify: () => void;
  submit?: boolean;
  onChangePhone: () => void;
  onResend: () => void;
  /** Checkout passes its own compact layout class. Account leaves this empty. */
  className?: string;
  actionClassName?: string;
}) {
  const { t, number } = useLocale();
  const [sentBefore, sentAfter = ""] = t("otpCodeSentTo").split("{phone}");

  return (
    <div
      className={className ? `phone-otp-code ${className}` : "phone-otp-code"}
    >
      <p className="auth-otp-sent">
        {sentBefore}
        <bdi dir="ltr">{formatIranMobileDraft(sentPhone)}</bdi>
        {sentAfter}
      </p>
      <label id={`${id}-label`} htmlFor={id}>
        {t("otpCodeLabel")}
      </label>
      <OtpCodeInput
        id={id}
        value={code}
        disabled={busy}
        invalid={invalid}
        labelledBy={`${id}-label`}
        onChange={onChange}
        onComplete={onComplete}
      />
      <Button
        type={submit ? "submit" : "button"}
        className={actionClassName}
        disabled={busy}
        aria-busy={busy || undefined}
        onClick={submit ? undefined : onVerify}
      >
        {busy ? t("submitting") : t("verifyOtpCode")}
      </Button>
      <div className="auth-otp-actions">
        <button
          className="auth-switch"
          type="button"
          disabled={busy}
          onClick={onChangePhone}
        >
          {t("changePhoneNumber")}
        </button>
        <button
          className="auth-switch"
          type="button"
          disabled={busy || cooldown > 0}
          onClick={onResend}
        >
          {cooldown > 0
            ? t("resendOtpIn", { seconds: number(cooldown) })
            : t("resendOtpCode")}
        </button>
      </div>
    </div>
  );
}
