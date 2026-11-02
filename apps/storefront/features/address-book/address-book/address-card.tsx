"use client";

import type { CustomerAddress } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { formatIranMobileDraft } from "@/lib/phone/iran-mobile";
import styles from "./address-card.module.css";

export function AddressCard({
  address,
  busy,
  disabled,
  onEdit,
  onDelete,
  onDefault,
}: {
  address: CustomerAddress;
  busy: boolean;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDefault: () => void;
}) {
  const { t } = useLocale();
  const name = address.recipientName;
  return (
    <li>
      <article
        className={styles.card}
        data-default={address.isDefault || undefined}
      >
        <div className={styles.head}>
          <h2>{name}</h2>
          {address.isDefault ? (
            <span className={styles.badge}>{t("addressesDefault")}</span>
          ) : null}
        </div>
        <p className={styles.lines}>
          <bdi>{formatIranMobileDraft(address.phone)}</bdi>
          <br />
          {address.provinceLabel}، {address.cityLabel}
          <br />
          {address.address}
          {address.postalCode ? (
            <>
              <br />
              <bdi>{address.postalCode}</bdi>
            </>
          ) : null}
        </p>
        <div className={styles.actions}>
          {address.isDefault ? null : (
            <button
              type="button"
              className="account-button"
              disabled={disabled}
              aria-busy={busy || undefined}
              onClick={onDefault}
            >
              {busy ? t("addressesSettingDefault") : t("addressesSetDefault")}
            </button>
          )}
          <button
            type="button"
            className="account-button account-button--quiet"
            disabled={disabled}
            aria-label={`${t("addressesEdit")} ${name}`}
            onClick={onEdit}
          >
            {t("addressesEdit")}
          </button>
          <button
            type="button"
            className="account-button account-button--oxide"
            disabled={disabled}
            aria-label={`${t("addressesDelete")} ${name}`}
            onClick={onDelete}
          >
            {t("addressesDelete")}
          </button>
        </div>
      </article>
    </li>
  );
}
