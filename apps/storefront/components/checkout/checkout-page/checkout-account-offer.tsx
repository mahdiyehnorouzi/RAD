"use client";

import { type KeyboardEvent, useState } from "react";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { Button } from "@/components/ui/button-link";
import { ApiError } from "@/lib/api";
import {
  NEW_OTP_ACCOUNT_NAME,
  authErrorCode,
  authErrorMessage,
} from "@/components/account/auth-login";
import { PhoneOtpCodeStep } from "@/components/account/phone-otp-code-step";
import { usePhoneOtp } from "@/components/account/use-phone-otp";
import { CheckoutField } from "./checkout-field";
import type { checkoutCopy } from "../const";

type Copy = (typeof checkoutCopy)["fa"] | (typeof checkoutCopy)["en"];
type Channel = "phone" | "email";
type EmailMode = "signup" | "signin";

export function CheckoutAccountOffer({
  name,
  phone,
  disabled = false,
  copy,
}: {
  name: string;
  phone: string;
  disabled?: boolean;
  copy: Copy;
}) {
  const { user, login, register, updateProfile } = useCommerce();
  const { t } = useLocale();
  const [consent, setConsent] = useState(false);
  const [channel, setChannel] = useState<Channel>("phone");
  const [emailMode, setEmailMode] = useState<EmailMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [nameKept, setNameKept] = useState(false);
  const otp = usePhoneOtp({
    phone,
    onVerified: async (signedIn) => {
      const trimmed = name.trim().replace(/\s+/g, " ");
      if (
        signedIn.name === NEW_OTP_ACCOUNT_NAME &&
        trimmed.length >= 2 &&
        trimmed.length <= 80
      ) {
        try {
          await updateProfile({ name: trimmed });
        } catch {
          setNameKept(true);
        }
      }
    },
  });

  if (user) {
    return (
      <p className="checkout-account-signed-in" role="status">
        {nameKept
          ? copy.accountNameKept
          : copy.accountSignedIn.replace("{name}", user.name)}
      </p>
    );
  }

  const stopCheckoutSubmit = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.stopPropagation();
  };

  const submitEmail = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (trimmedName.length < 2) {
      setError(copy.accountNameFirst);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError(t("emailInvalid"));
      return;
    }
    if (password.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }
    try {
      setError("");
      setNotice("");
      setBusy(true);
      if (emailMode === "signup") {
        await register({
          name: trimmedName,
          email: trimmedEmail,
          password,
        });
      } else {
        await login({ email: trimmedEmail, password });
      }
      setPassword("");
    } catch (err) {
      if (authErrorCode(err) === "account_exists") {
        setEmailMode("signin");
        setError(t("accountExists"));
        return;
      }
      if (
        emailMode === "signin" &&
        err instanceof ApiError &&
        err.code === "account_missing"
      ) {
        setEmailMode("signup");
      }
      setError(authErrorMessage(err, "password", t));
    } finally {
      setBusy(false);
    }
  };

  const accountInvalid =
    channel === "email" ? Boolean(error) : Boolean(otp.error);

  return (
    <div className={`checkout-account${accountInvalid ? " is-invalid" : ""}`}>
      <label className="checkout-account-consent">
        <input
          className="checkout-choice"
          type="checkbox"
          checked={consent}
          disabled={disabled || busy}
          onChange={(event) => {
            setConsent(event.currentTarget.checked);
            setError("");
            setNotice("");
          }}
        />
        <span>{copy.accountConsent}</span>
      </label>

      {consent ? (
        <div className="checkout-account-choice">
          <div
            className="checkout-account-channels"
            role="radiogroup"
            aria-invalid={accountInvalid || undefined}
          >
            <label>
              <input
                className="checkout-choice"
                type="radio"
                name="checkout-account-channel"
                checked={channel === "phone"}
                disabled={disabled || busy}
                onChange={() => {
                  setChannel("phone");
                  setError("");
                }}
              />
              <span>{copy.accountPhone}</span>
            </label>
            <label>
              <input
                className="checkout-choice"
                type="radio"
                name="checkout-account-channel"
                checked={channel === "email"}
                disabled={disabled || busy}
                onChange={() => {
                  setChannel("email");
                  setError("");
                }}
              />
              <span>{copy.accountEmail}</span>
            </label>
          </div>

          {channel === "phone" ? (
            <div className="checkout-account-panel">
              {otp.step === "phone" ? (
                <Button
                  type="button"
                  className="checkout-account-action"
                  disabled={disabled || otp.busy}
                  aria-busy={otp.busy || undefined}
                  onClick={() => void otp.send()}
                >
                  {otp.busy ? t("submitting") : t("sendOtpCode")}
                </Button>
              ) : (
                <PhoneOtpCodeStep
                  id="checkout-account-otp"
                  className="checkout-otp"
                  actionClassName="checkout-account-action"
                  sentPhone={otp.sentPhone}
                  code={otp.code}
                  busy={disabled || otp.busy}
                  invalid={Boolean(otp.error)}
                  cooldown={otp.cooldown}
                  onChange={otp.setCode}
                  onComplete={(next) => void otp.verify(next)}
                  onVerify={() => void otp.verify(otp.code)}
                  onChangePhone={otp.changePhone}
                  onResend={() => void otp.send(otp.sentPhone)}
                />
              )}
            </div>
          ) : (
            <div className="checkout-account-panel">
              {emailMode === "signin" ? <p>{copy.accountEmailSignIn}</p> : null}
              <CheckoutField
                id="checkout-account-email"
                label={t("emailLabel")}
              >
                <input
                  id="checkout-account-email"
                  name="accountEmail"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  disabled={disabled || busy}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      stopCheckoutSubmit(event);
                      void submitEmail();
                    }
                  }}
                />
              </CheckoutField>
              <CheckoutField
                id="checkout-account-password"
                label={t("passwordLabel")}
                hint={t("passwordHelp")}
              >
                <input
                  id="checkout-account-password"
                  name="accountPassword"
                  type="password"
                  autoComplete={
                    emailMode === "signin" ? "current-password" : "new-password"
                  }
                  minLength={8}
                  value={password}
                  disabled={disabled || busy}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      stopCheckoutSubmit(event);
                      void submitEmail();
                    }
                  }}
                />
              </CheckoutField>
              <Button
                type="button"
                className="checkout-account-action"
                disabled={disabled || busy}
                aria-busy={busy || undefined}
                onClick={() => void submitEmail()}
              >
                {busy
                  ? t("submitting")
                  : emailMode === "signin"
                    ? t("login")
                    : t("signup")}
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {error && channel === "email" ? (
        <p className="checkout-field-error" role="alert">
          {error}
        </p>
      ) : null}
      {otp.error && channel === "phone" ? (
        <p className="checkout-field-error" role="alert">
          {otp.error}
        </p>
      ) : null}
      {otp.notice && channel === "phone" ? (
        <p className="checkout-field-hint" role="status">
          {otp.notice}
        </p>
      ) : null}
      {notice ? (
        <p className="checkout-field-hint" role="status">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
