"use client";

import { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import {
  loadRememberedEmail,
  loadRememberMe,
  saveLoginPreferences,
} from "../lib/admin-storage";
import { Field } from "./admin-dialog";

function LoginBrand({ tagline }: { tagline?: string }) {
  return (
    <header className="login-visual">
      <div className="brand-block">
        <span className="brand-mark">
          <img src="/rad-logo.png" alt="" width={48} height={48} />
        </span>
        <strong>پنل مدیریت استودیو</strong>
        <small>رَد</small>
      </div>
      {tagline ? <p className="visual-tagline">{tagline}</p> : null}
    </header>
  );
}

function ConnectingScreen() {
  return (
    <div className="connecting-screen" role="status" aria-live="polite">
      <div className="connecting-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p>در حال اتصال به پنل مدیریت…</p>
    </div>
  );
}

export function AdminLogin({
  onLogin,
  onForgotPassword,
}: {
  onLogin: (input: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => Promise<void>;
  onForgotPassword: (email: string) => Promise<{ message: string }>;
}) {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState(() => loadRememberedEmail());
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => loadRememberMe());
  const [error, setError] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [connecting, setConnecting] = useState(false);

  if (connecting) return <ConnectingScreen />;

  if (mode === "forgot") {
    return (
      <div className="login-screen" dir="rtl">
        <LoginBrand />
        <div className="login-form-side">
          <section className="login-form-card">
            <span className="eyebrow">دفتر کوره</span>
            <h1>فراموشی رمز عبور</h1>
            <p>
              ایمیل حساب مدیریتی خود را وارد کنید. یک کد ۶ رقمی به ایمیل شما
              ارسال می‌شود.
            </p>
            <form
              className="editor-form"
              noValidate
              onSubmit={async (event) => {
                event.preventDefault();
                try {
                  setError("");
                  const result = await onForgotPassword(email.trim());
                  setForgotMessage(result.message);
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
            >
              {error && (
                <small className="field-error" role="alert">
                  {error}
                </small>
              )}
              {forgotMessage && (
                <div className="login-success" role="status">
                  <p>{forgotMessage}</p>
                  <a
                    className="text-link"
                    href={`/reset-password?email=${encodeURIComponent(email.trim())}`}
                  >
                    وارد کردن کد بازیابی
                  </a>
                </div>
              )}
              <Field label="ایمیل">
                <input
                  dir="ltr"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  required
                />
              </Field>
              <button className="primary-action" type="submit">
                ارسال کد بازیابی
              </button>
              <button
                className="text-link-button"
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setForgotMessage("");
                }}
              >
                بازگشت به ورود
              </button>
            </form>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen" dir="rtl">
      <LoginBrand tagline="هیچ دو رَدی یکسان نیست." />
      <div className="login-form-side">
        <section className="login-form-card">
          <span className="eyebrow">دفتر کوره</span>
          <h1>ورود به مدیریت رَد</h1>
          <p>
            حساب‌های جدید مشتری از فروشگاه ساخته می‌شوند. محصولات تازه را پس از
            ورود در همین پنل اضافه کنید.
          </p>
          <form
            className="editor-form"
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                setError("");
                saveLoginPreferences(email, rememberMe);
                setConnecting(true);
                await onLogin({ email: email.trim(), password, rememberMe });
              } catch (err) {
                setConnecting(false);
                setError((err as Error).message);
              }
            }}
          >
            {error && (
              <small className="field-error" role="alert">
                {error}
              </small>
            )}
            <Field label="ایمیل">
              <input
                dir="ltr"
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
              />
            </Field>
            <Field label="رمز عبور">
              <div className="password-field">
                <input
                  dir="ltr"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </Field>
            <label className="remember-field">
              <input
                type="checkbox"
                name="remember"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>
                مرا به خاطر بسپار — ایمیل و ورود در این مرورگر نگه داشته شود
              </span>
            </label>
            <div className="login-actions">
              <button className="primary-action" type="submit">
                ورود
                <ArrowLeft />
              </button>
              <button
                className="text-link-button"
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setError("");
                }}
              >
                رمز عبور را فراموش کرده‌اید؟
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
