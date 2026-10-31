"use client";

import { FormEvent, useEffect, useReducer, useRef } from "react";
import { LogOut, Mail, Phone, UserRound } from "lucide-react";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { ApiError, readableErrorMessage } from "@/lib/api";
import {
  applyIranMobileEdit,
  formatIranMobileDraft,
} from "@/lib/phone/iran-mobile";
import { AccountShell } from "./account-shell";
import { AccountHeading } from "./account-heading";
import {
  initialProfileState,
  profileIsDirty,
  profileUpdatePayload,
  reduceProfileForm,
  type ProfileCopy,
} from "./profile-form";
import "./account-info.css";

const PROFILE_CODES: Record<
  string,
  "accountPhoneInvalid" | "accountPhoneTaken"
> = {
  phone_invalid: "accountPhoneInvalid",
  phone_taken: "accountPhoneTaken",
};

export function AccountInfoPage() {
  const { user, logout, updateProfile } = useCommerce();
  const { t } = useLocale();
  const [state, dispatch] = useReducer(reduceProfileForm, user, (current) =>
    initialProfileState(current ?? { name: "", email: "", phone: null }),
  );
  const saving = useRef(false);
  const phoneRef = useRef<HTMLInputElement>(null);
  const phoneCaret = useRef<number | null>(null);
  const dirty = profileIsDirty(state);
  const copy: ProfileCopy = {
    nameInvalid: t("accountNameInvalid"),
    nameTooLong: t("accountNameTooLong"),
    phoneInvalid: t("accountPhoneInvalid"),
  };

  useEffect(() => {
    if (!user) return;
    dispatch({ type: "user", user });
  }, [user]);

  useEffect(() => {
    const node = phoneRef.current;
    const caret = phoneCaret.current;
    if (!node || caret == null) return;
    node.setSelectionRange(caret, caret);
    phoneCaret.current = null;
  }, [state.draft.phone]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving.current || state.phase === "saving") return;
    const next = reduceProfileForm(state, { type: "submit", copy });
    dispatch({ type: "submit", copy });
    if (next.phase !== "saving") return;
    saving.current = true;
    try {
      const saved = await updateProfile(profileUpdatePayload(next.draft));
      dispatch({ type: "success", user: saved });
    } catch (error) {
      const key =
        error instanceof ApiError && error.code
          ? PROFILE_CODES[error.code]
          : undefined;
      dispatch({
        type: "failure",
        message: key
          ? t(key)
          : readableErrorMessage(error, t("profileSaveFailed")),
      });
    } finally {
      saving.current = false;
    }
  };

  return (
    <AccountShell requireAuth>
      {user ? (
        <section className="account-info section">
          <AccountHeading
            icon={UserRound}
            title={t("accountInfo")}
            body={t("accountInfoBody")}
          />
          <form className="account-info-form" onSubmit={submit} noValidate>
            <div className="account-info-sheet">
              <label className="account-info-field" htmlFor="account-name">
                <span>
                  <UserRound aria-hidden="true" strokeWidth={1.6} />
                  {t("nameLabel")}
                </span>
                <input
                  id="account-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={state.draft.name}
                  maxLength={80}
                  disabled={state.phase === "saving"}
                  aria-invalid={state.errors.name ? true : undefined}
                  aria-describedby={
                    state.errors.name ? "account-name-error" : undefined
                  }
                  onChange={(event) =>
                    dispatch({
                      type: "edit",
                      field: "name",
                      value: event.currentTarget.value,
                    })
                  }
                />
                {state.errors.name ? (
                  <small id="account-name-error" role="alert">
                    {state.errors.name}
                  </small>
                ) : null}
              </label>

              <div className="account-info-field">
                <span id="account-email-label">
                  <Mail aria-hidden="true" strokeWidth={1.6} />
                  {t("emailLabel")}
                </span>
                <bdi dir="ltr" aria-labelledby="account-email-label">
                  {user.email}
                </bdi>
                <small>{t("accountEmailLocked")}</small>
              </div>

              <label className="account-info-field" htmlFor="account-phone">
                <span>
                  <Phone aria-hidden="true" strokeWidth={1.6} />
                  {t("accountPhoneLabel")}
                  <em>{t("accountPhoneOptional")}</em>
                </span>
                <input
                  ref={phoneRef}
                  id="account-phone"
                  name="phone"
                  className="account-info-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  dir="ltr"
                  placeholder={t("accountPhonePlaceholder")}
                  value={state.draft.phone}
                  disabled={state.phase === "saving"}
                  aria-invalid={state.errors.phone ? true : undefined}
                  aria-describedby={
                    state.errors.phone
                      ? "account-phone-error"
                      : "account-phone-hint"
                  }
                  onChange={(event) => {
                    const cursor =
                      event.currentTarget.selectionStart ??
                      event.currentTarget.value.length;
                    const edit = applyIranMobileEdit(
                      state.draft.phone,
                      event.currentTarget.value,
                      cursor,
                    );
                    phoneCaret.current = edit.cursor;
                    dispatch({
                      type: "edit",
                      field: "phone",
                      value: edit.value,
                    });
                  }}
                  onBlur={() => {
                    const canonical = profileUpdatePayload(state.draft).phone;
                    if (!canonical) return;
                    const formatted = formatIranMobileDraft(canonical);
                    if (formatted === state.draft.phone) return;
                    dispatch({
                      type: "edit",
                      field: "phone",
                      value: formatted,
                    });
                  }}
                />
                {state.errors.phone ? (
                  <small id="account-phone-error" role="alert">
                    {state.errors.phone}
                  </small>
                ) : (
                  <small id="account-phone-hint">{t("accountPhoneHint")}</small>
                )}
              </label>
            </div>

            {state.phase === "saved" ? (
              <p className="account-info-status" role="status">
                {t("profileSaved")}
              </p>
            ) : null}
            {state.phase === "error" && state.message ? (
              <p className="account-info-status is-error" role="alert">
                {state.message}
              </p>
            ) : null}

            <div className="account-info-actions">
              <button
                type="submit"
                className="account-button"
                disabled={state.phase === "saving" || !dirty}
                aria-busy={state.phase === "saving" || undefined}
              >
                {state.phase === "saving"
                  ? t("savingProfile")
                  : t("saveProfile")}
              </button>
            </div>
          </form>
          <button
            type="button"
            className="account-button account-button--oxide account-info-logout"
            onClick={logout}
          >
            <LogOut aria-hidden="true" strokeWidth={1.6} />
            {t("logout")}
          </button>
        </section>
      ) : null}
    </AccountShell>
  );
}
