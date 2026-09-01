"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";

export function ResetPasswordPage({ email: initialEmail }: { email: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  return (
    <div className="admin-login">
      <section className="paper-panel">
        <span className="eyebrow">دفتر کوره</span>
        <h1>رمز عبور جدید</h1>
        <p>کد ۶ رقمی که به ایمیل شما ارسال شده را وارد کنید و رمز عبور جدید انتخاب کنید.</p>
        {done ? (
          <div className="login-success">
            <p>رمز عبور با موفقیت تغییر کرد.</p>
            <button className="primary-action" type="button" onClick={() => router.push("/")}>ورود به پنل</button>
          </div>
        ) : (
          <form
            className="editor-form"
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
                setError("ایمیل معتبر وارد کنید.");
                return;
              }
              if (!/^\d{6}$/.test(code.trim())) {
                setError("کد بازیابی باید ۶ رقم باشد.");
                return;
              }
              if (password.length < 8) {
                setError("رمز عبور باید حداقل ۸ نویسه باشد.");
                return;
              }
              if (password !== confirm) {
                setError("تکرار رمز عبور با رمز جدید یکسان نیست.");
                return;
              }
              try {
                setError("");
                await api("/auth/password/reset", {
                  method: "POST",
                  body: JSON.stringify({
                    email: email.trim(),
                    code: code.trim(),
                    password,
                  }),
                });
                setDone(true);
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          >
            {error && <small className="field-error" role="alert">{error}</small>}
            <label className="field">
              <span>ایمیل</span>
              <input
                dir="ltr"
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label className="field">
              <span>کد بازیابی</span>
              <input
                dir="ltr"
                type="text"
                name="reset-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
            </label>
            <label className="field">
              <span>رمز عبور جدید</span>
              <input
                dir="ltr"
                type="password"
                name="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label className="field">
              <span>تکرار رمز عبور جدید</span>
              <input
                dir="ltr"
                type="password"
                name="confirm-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <button className="primary-action" type="submit">ذخیره رمز عبور</button>
            <Link className="text-link" href="/">بازگشت به ورود</Link>
          </form>
        )}
      </section>
    </div>
  );
}
