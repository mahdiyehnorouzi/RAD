"use client";

import { FormEvent, useReducer, useRef, useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { changeAccountPassword } from "@/lib/api";
import {
  initialPasswordState,
  passwordChangeMessage,
  reducePasswordForm,
  type PasswordCopy,
  type PasswordField,
} from "./password-change";

export function PasswordForm() {
  const { t } = useLocale();
  const [state, dispatch] = useReducer(
    reducePasswordForm,
    undefined,
    initialPasswordState,
  );
  const [visible, setVisible] = useState<Record<PasswordField, boolean>>({
    current: false,
    next: false,
    confirm: false,
  });
  const saving = useRef(false);
  const copy: PasswordCopy = {
    currentRequired: t("passwordCurrentRequired"),
    tooShort: t("passwordTooShort"),
    mismatch: t("passwordMismatch"),
    reused: t("passwordReused"),
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving.current || state.phase === "saving") return;
    const next = reducePasswordForm(state, { type: "submit", copy });
    dispatch({ type: "submit", copy });
    if (next.phase !== "saving") return;
    saving.current = true;
    try {
      await changeAccountPassword({
        currentPassword: next.draft.current,
        newPassword: next.draft.next,
      });
      setVisible({ current: false, next: false, confirm: false });
      dispatch({ type: "success" });
    } catch (error) {
      dispatch({
        type: "failure",
        message: passwordChangeMessage(error, t),
      });
    } finally {
      saving.current = false;
    }
  };

  return (
    <form
      className="account-info-form account-password-form"
      onSubmit={submit}
      noValidate
    >
      <div className="account-password-heading">
        <KeyRound aria-hidden="true" strokeWidth={1.6} />
        <div>
          <h2>{t("passwordChangeTitle")}</h2>
          <p>{t("passwordChangeBody")}</p>
        </div>
      </div>
      <div className="account-info-sheet">
        <PasswordField
          id="account-current-password"
          name="current-password"
          label={t("passwordCurrentLabel")}
          autoComplete="current-password"
          value={state.draft.current}
          shown={visible.current}
          error={state.errors.current}
          disabled={state.phase === "saving"}
          showLabel={t("showPassword")}
          hideLabel={t("hidePassword")}
          onToggle={() =>
            setVisible((current) => ({ ...current, current: !current.current }))
          }
          onChange={(value) =>
            dispatch({ type: "edit", field: "current", value })
          }
        />
        <PasswordField
          id="account-new-password"
          name="new-password"
          label={t("passwordNewLabel")}
          autoComplete="new-password"
          value={state.draft.next}
          shown={visible.next}
          error={state.errors.next}
          hint={state.errors.next ? undefined : t("passwordHelp")}
          disabled={state.phase === "saving"}
          showLabel={t("showPassword")}
          hideLabel={t("hidePassword")}
          onToggle={() =>
            setVisible((current) => ({ ...current, next: !current.next }))
          }
          onChange={(value) => dispatch({ type: "edit", field: "next", value })}
        />
        <PasswordField
          id="account-confirm-password"
          name="confirm-password"
          label={t("passwordConfirmLabel")}
          autoComplete="new-password"
          value={state.draft.confirm}
          shown={visible.confirm}
          error={state.errors.confirm}
          disabled={state.phase === "saving"}
          showLabel={t("showPassword")}
          hideLabel={t("hidePassword")}
          onToggle={() =>
            setVisible((current) => ({
              ...current,
              confirm: !current.confirm,
            }))
          }
          onChange={(value) =>
            dispatch({ type: "edit", field: "confirm", value })
          }
        />
      </div>
      {state.phase === "saved" ? (
        <p className="account-info-status" role="status">
          {t("passwordChanged")}
        </p>
      ) : null}
      {state.phase === "error" && state.message ? (
        <p className="account-info-status is-error" role="alert">
          {state.message}
        </p>
      ) : null}
      <p className="account-password-note">{t("passwordSessionNote")}</p>
      <div className="account-info-actions">
        <button
          type="submit"
          className="account-button"
          disabled={state.phase === "saving"}
          aria-busy={state.phase === "saving" || undefined}
        >
          {state.phase === "saving" ? t("savingPassword") : t("savePassword")}
        </button>
      </div>
    </form>
  );
}

function PasswordField({
  id,
  name,
  label,
  autoComplete,
  value,
  shown,
  error,
  hint,
  disabled,
  showLabel,
  hideLabel,
  onToggle,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  value: string;
  shown: boolean;
  error?: string;
  hint?: string;
  disabled: boolean;
  showLabel: string;
  hideLabel: string;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="account-info-field">
      <span>
        <label htmlFor={id}>{label}</label>
      </span>
      <div className="account-password-control">
        <input
          id={id}
          name={name}
          type={shown ? "text" : "password"}
          dir="ltr"
          autoComplete={autoComplete}
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        <button
          type="button"
          className="account-password-toggle"
          aria-pressed={shown}
          aria-label={shown ? hideLabel : showLabel}
          onClick={onToggle}
        >
          {shown ? (
            <EyeOff aria-hidden="true" strokeWidth={1.6} />
          ) : (
            <Eye aria-hidden="true" strokeWidth={1.6} />
          )}
        </button>
      </div>
      {error ? (
        <small id={`${id}-error`} role="alert">
          {error}
        </small>
      ) : hint ? (
        <small id={`${id}-hint`}>{hint} </small>
      ) : null}
    </div>
  );
}
