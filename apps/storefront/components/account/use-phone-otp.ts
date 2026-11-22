"use client";

import { useEffect, useRef, useState } from "react";
import type { AuthUser } from "@rad/types";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { canonicalIranMobile } from "@/lib/phone/iran-mobile";
import {
  OTP_RESEND_COOLDOWN_SECONDS,
  authErrorMessage,
  normalizeOtpCode,
  otpCodeAlreadySent,
} from "./auth-login";

type OtpStep = "phone" | "code";

/**
 * The account sign-in OTP path: `POST /auth/otp/request`, then
 * `POST /auth/otp/signin`. Checkout uses this hook so it cannot grow a
 * second cooldown, error map, or verify lock.
 */
export function usePhoneOtp(options?: {
  initialError?: string;
  /**
   * When set, send uses this number. The account form leaves it unset and
   * types into `phone` / `setPhone` instead.
   */
  phone?: string;
  onVerified?: (user: AuthUser) => void | Promise<void>;
}) {
  const { requestOtp, signInWithOtp } = useCommerce();
  const { t } = useLocale();
  const controlledPhone = options?.phone;
  const [ownPhone, setOwnPhone] = useState("");
  const phone = controlledPhone ?? ownPhone;
  const [step, setStep] = useState<OtpStep>("phone");
  const [sentPhone, setSentPhone] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState(options?.initialError ?? "");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const verifyLock = useRef(false);
  const onVerified = useRef(options?.onVerified);
  onVerified.current = options?.onVerified;
  const phoneSource = useRef(controlledPhone);
  phoneSource.current = controlledPhone;

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setTimeout(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const clearMessages = () => {
    setError("");
    setNotice("");
  };

  const toCodeStep = (normalized: string) => {
    setSentPhone(normalized);
    setCode("");
    setStep("code");
    setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
  };

  const send = async (rawPhone?: string) => {
    const source = rawPhone ?? phoneSource.current ?? ownPhone;
    const normalized = canonicalIranMobile(source);
    if (!normalized) {
      setNotice("");
      setError(t("phoneInvalid"));
      return false;
    }
    try {
      clearMessages();
      setBusy(true);
      await requestOtp(normalized);
      toCodeStep(normalized);
      if (step === "code") setNotice(t("otpResent"));
      return true;
    } catch (err) {
      if (otpCodeAlreadySent(err)) {
        if (step === "phone") toCodeStep(normalized);
        else setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      }
      setError(authErrorMessage(err, "otpRequest", t));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const verify = async (raw: string) => {
    if (busy || verifyLock.current) return;
    const normalizedCode = normalizeOtpCode(raw);
    if (!normalizedCode) {
      setNotice("");
      setError(t("otpCodeInvalidFormat"));
      return;
    }
    verifyLock.current = true;
    try {
      clearMessages();
      setBusy(true);
      const user = await signInWithOtp({
        phone: sentPhone,
        code: normalizedCode,
      });
      await onVerified.current?.(user);
    } catch (err) {
      setError(authErrorMessage(err, "otpSignIn", t));
      setCode("");
    } finally {
      verifyLock.current = false;
      setBusy(false);
    }
  };

  const changePhone = () => {
    setStep("phone");
    setSentPhone("");
    setCode("");
    clearMessages();
  };

  return {
    step,
    phone,
    setPhone: setOwnPhone,
    sentPhone,
    code,
    setCode,
    cooldown,
    busy,
    error,
    notice,
    setNotice,
    clearMessages,
    send,
    verify,
    changePhone,
  };
}
