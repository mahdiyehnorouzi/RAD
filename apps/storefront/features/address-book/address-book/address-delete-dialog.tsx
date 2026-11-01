"use client";

import { useEffect, useRef } from "react";
import type { CustomerAddress } from "@rad/types";
import { useLocale } from "@/components/i18n";
import styles from "./address-delete-dialog.module.css";

export function AddressDeleteDialog({
  address,
  busy,
  onConfirm,
  onDismiss,
}: {
  address: CustomerAddress;
  busy: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const { t } = useLocale();
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!node.open) node.showModal();
    cancelRef.current?.focus();
    return () => {
      if (node.open) node.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="address-delete-title"
      aria-describedby="address-delete-body"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onDismiss();
      }}
    >
      <h2 id="address-delete-title">{t("addressesDeleteTitle")}</h2>
      <p id="address-delete-body">{t("addressesDeleteBody")}</p>
      <p className={styles.summary}>
        <strong>{address.recipientName}</strong>
        <br />
        {address.provinceLabel}، {address.cityLabel}
        <br />
        {address.address}
      </p>
      <div className={styles.actions}>
        <button
          ref={cancelRef}
          type="button"
          className="account-button account-button--quiet"
          disabled={busy}
          onClick={onDismiss}
        >
          {t("addressesCancel")}
        </button>
        <button
          type="button"
          className="account-button account-button--oxide"
          disabled={busy}
          aria-busy={busy || undefined}
          onClick={onConfirm}
        >
          {busy ? t("addressesDeleting") : t("addressesDeleteConfirm")}
        </button>
      </div>
    </dialog>
  );
}
