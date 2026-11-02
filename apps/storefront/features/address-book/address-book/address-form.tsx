"use client";

import { FormEvent, useLayoutEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { IRAN_PROVINCES, citiesInProvince } from "@/lib/geo/iran-locations";
import { toLatinDigits } from "@/lib/payment/receipt";
import { applyIranMobileEdit } from "@/lib/phone/iran-mobile";
import type { AddressDraft, AddressErrors } from "../type";
import styles from "./address-form.module.css";

export function AddressForm({
  mode,
  draft,
  errors,
  busy,
  canChooseDefault,
  onDraft,
  onProvince,
  onCity,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  draft: AddressDraft;
  errors: AddressErrors;
  busy: boolean;
  canChooseDefault: boolean;
  onDraft: (field: keyof AddressDraft, value: string | boolean) => void;
  onProvince: (provinceId: string) => void;
  onCity: (cityId: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const phoneRef = useRef<HTMLInputElement>(null);
  const phoneCaret = useRef<number | null>(null);
  const cities = citiesInProvince(draft.provinceId);

  useLayoutEffect(() => {
    const node = phoneRef.current;
    const caret = phoneCaret.current;
    if (!node || caret == null) return;
    node.setSelectionRange(caret, caret);
    phoneCaret.current = null;
  }, [draft.phone]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    onSubmit();
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <button
        type="button"
        className="account-button account-button--quiet"
        onClick={onCancel}
        disabled={busy}
      >
        {t("addressesBack")}
      </button>
      <div className={styles.sheet}>
        <label className={styles.field} htmlFor="address-recipient">
          <span>{t("addressesRecipient")}</span>
          <input
            id="address-recipient"
            name="recipientName"
            type="text"
            autoComplete="name"
            value={draft.recipientName}
            maxLength={80}
            disabled={busy}
            aria-invalid={errors.recipientName ? true : undefined}
            aria-describedby={
              errors.recipientName ? "address-recipient-error" : undefined
            }
            onChange={(event) =>
              onDraft("recipientName", event.currentTarget.value)
            }
          />
          {errors.recipientName ? (
            <small
              id="address-recipient-error"
              className={styles.error}
              role="alert"
            >
              {errors.recipientName}
            </small>
          ) : null}
        </label>

        <label className={styles.field} htmlFor="address-phone">
          <span>{t("addressesPhone")}</span>
          <input
            ref={phoneRef}
            id="address-phone"
            name="phone"
            className={styles.ltr}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            dir="ltr"
            value={draft.phone}
            disabled={busy}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? "address-phone-error" : undefined}
            onChange={(event) => {
              const cursor =
                event.currentTarget.selectionStart ??
                event.currentTarget.value.length;
              const edit = applyIranMobileEdit(
                draft.phone,
                event.currentTarget.value,
                cursor,
              );
              phoneCaret.current = edit.cursor;
              onDraft("phone", edit.value);
            }}
          />
          {errors.phone ? (
            <small
              id="address-phone-error"
              className={styles.error}
              role="alert"
            >
              {errors.phone}
            </small>
          ) : null}
        </label>

        <div className={styles.field}>
          <label className={styles.legend} htmlFor="address-province">
            {t("addressesProvince")}
          </label>
          <div className={styles.select}>
            <select
              id="address-province"
              name="province"
              value={draft.provinceId}
              disabled={busy}
              data-empty={draft.provinceId ? undefined : ""}
              aria-invalid={errors.provinceId ? true : undefined}
              aria-describedby={
                errors.provinceId ? "address-province-error" : undefined
              }
              aria-required="true"
              autoComplete="address-level1"
              onChange={(event) => onProvince(event.currentTarget.value)}
            >
              <option value="">{t("addressesProvincePlaceholder")}</option>
              {IRAN_PROVINCES.map((province) => (
                <option key={province.id} value={province.id}>
                  {province.label}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" />
          </div>
          {errors.provinceId ? (
            <small
              id="address-province-error"
              className={styles.error}
              role="alert"
            >
              {errors.provinceId}
            </small>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.legend} htmlFor="address-city">
            {t("addressesCity")}
          </label>
          <div className={styles.select}>
            <select
              id="address-city"
              name="city"
              value={draft.cityId}
              disabled={busy || !draft.provinceId}
              data-empty={draft.cityId ? undefined : ""}
              aria-invalid={errors.cityId ? true : undefined}
              aria-describedby={
                errors.cityId ? "address-city-error" : undefined
              }
              aria-required="true"
              autoComplete="address-level2"
              onChange={(event) => onCity(event.currentTarget.value)}
            >
              <option value="">
                {draft.provinceId
                  ? t("addressesCityPlaceholder")
                  : t("addressesCityWaiting")}
              </option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.label}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" />
          </div>
          {errors.cityId ? (
            <small
              id="address-city-error"
              className={styles.error}
              role="alert"
            >
              {errors.cityId}
            </small>
          ) : null}
        </div>

        <label className={styles.field} htmlFor="address-line">
          <span>{t("addressesLine")}</span>
          <textarea
            id="address-line"
            name="address"
            rows={3}
            autoComplete="street-address"
            placeholder={t("addressesLinePlaceholder")}
            value={draft.address}
            maxLength={400}
            disabled={busy}
            aria-invalid={errors.address ? true : undefined}
            aria-describedby={errors.address ? "address-line-error" : undefined}
            onChange={(event) => onDraft("address", event.currentTarget.value)}
          />
          {errors.address ? (
            <small
              id="address-line-error"
              className={styles.error}
              role="alert"
            >
              {errors.address}
            </small>
          ) : null}
        </label>

        <label className={styles.field} htmlFor="address-postal">
          <span>
            {t("addressesPostal")}
            <em className={styles.optional}>{t("addressesPostalOptional")}</em>
          </span>
          <input
            id="address-postal"
            name="postalCode"
            className={styles.ltr}
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            dir="ltr"
            value={draft.postalCode}
            disabled={busy}
            aria-invalid={errors.postalCode ? true : undefined}
            aria-describedby={
              errors.postalCode ? "address-postal-error" : undefined
            }
            onChange={(event) =>
              onDraft(
                "postalCode",
                toLatinDigits(event.currentTarget.value)
                  .replace(/\D/g, "")
                  .slice(0, 10),
              )
            }
          />
          {errors.postalCode ? (
            <small
              id="address-postal-error"
              className={styles.error}
              role="alert"
            >
              {errors.postalCode}
            </small>
          ) : null}
        </label>

        {mode === "create" ? (
          <label className={`${styles.field} ${styles.check}`}>
            <input
              type="checkbox"
              name="isDefault"
              checked={draft.isDefault || !canChooseDefault}
              disabled={busy || !canChooseDefault}
              onChange={(event) =>
                onDraft("isDefault", event.currentTarget.checked)
              }
            />
            <span>{t("addressesUseDefault")}</span>
          </label>
        ) : null}
      </div>

      <div className={styles.actions}>
        <button
          type="submit"
          className="account-button"
          disabled={busy}
          aria-busy={busy || undefined}
        >
          {busy ? t("addressesSaving") : t("addressesSave")}
        </button>
        <button
          type="button"
          className="account-button account-button--quiet"
          disabled={busy}
          onClick={onCancel}
        >
          {t("addressesCancel")}
        </button>
      </div>
    </form>
  );
}
