"use client";

import type { CustomerAddress } from "@rad/types";
import { formatIranMobileDraft } from "@/lib/phone/iran-mobile";
import type { CheckoutAddressStatus } from "./use-checkout-addresses";
import styles from "./saved-address-picker.module.css";

type SavedAddressCopy = {
  savedTitle: string;
  savedLede: string;
  savedDefault: string;
  savedManual: string;
  savedLoading: string;
  savedEmpty: string;
  savedError: string;
  savedExpired: string;
  savedRetry: string;
  savedEdited: string;
  savedMissing: string;
};

export function SavedAddressPicker({
  status,
  addresses,
  choice,
  savedAddressId,
  diverged,
  missing,
  disabled,
  copy,
  onSelect,
  onManual,
  onRetry,
}: {
  status: CheckoutAddressStatus;
  addresses: readonly CustomerAddress[];
  choice: "" | "saved" | "manual";
  savedAddressId: string;
  diverged: boolean;
  missing: boolean;
  disabled: boolean;
  copy: SavedAddressCopy;
  onSelect: (address: CustomerAddress) => void;
  onManual: () => void;
  onRetry: () => void;
}) {
  if (status === "idle") return null;

  return (
    <div
      className={styles.picker}
      aria-busy={status === "loading" || undefined}
    >
      {status === "loading" ? (
        <p className={styles.status} role="status">
          {copy.savedLoading}
        </p>
      ) : null}

      {status === "error" || status === "expired" ? (
        <div className="checkout-alert" role="alert">
          <p>{status === "expired" ? copy.savedExpired : copy.savedError}</p>
          <button
            type="button"
            className={styles.retry}
            onClick={onRetry}
            disabled={disabled}
          >
            {copy.savedRetry}
          </button>
        </div>
      ) : null}

      {status === "ready" && addresses.length === 0 ? (
        <p className={styles.status} role="status">
          {copy.savedEmpty}
        </p>
      ) : null}

      {status === "ready" && addresses.length > 0 ? (
        <fieldset className={styles.group} disabled={disabled}>
          <legend className={styles.legend}>{copy.savedTitle}</legend>
          <p className={styles.lede}>{copy.savedLede}</p>
          {addresses.map((address) => {
            const selected =
              choice === "saved" && savedAddressId === address.id;
            return (
              <label
                key={address.id}
                className={styles.card}
                data-default={address.isDefault || undefined}
                data-selected={selected || undefined}
              >
                <input
                  type="radio"
                  name="checkout-saved-address"
                  value={address.id}
                  checked={selected}
                  onChange={() => onSelect(address)}
                />
                <span className={styles.body}>
                  <span className={styles.head}>
                    <span className={styles.name}>{address.recipientName}</span>
                    {address.isDefault ? (
                      <span className={styles.badge}>{copy.savedDefault}</span>
                    ) : null}
                  </span>
                  <span className={styles.lines}>
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
                  </span>
                </span>
              </label>
            );
          })}
          <label
            className={styles.card}
            data-selected={choice === "manual" || undefined}
          >
            <input
              type="radio"
              name="checkout-saved-address"
              value=""
              checked={choice === "manual"}
              onChange={onManual}
            />
            <span className={styles.name}>{copy.savedManual}</span>
          </label>
        </fieldset>
      ) : null}

      {diverged ? (
        <p className={styles.note} role="status">
          {copy.savedEdited}
        </p>
      ) : null}
      {missing ? (
        <p className={styles.note} role="status">
          {copy.savedMissing}
        </p>
      ) : null}
    </div>
  );
}
