"use client";

import type { CustomerAddress } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { AddressCard } from "./address-card";
import styles from "./address-list.module.css";

export function AddressList({
  addresses,
  busyId,
  disabled,
  onEdit,
  onDelete,
  onDefault,
}: {
  addresses: CustomerAddress[];
  busyId: string;
  disabled: boolean;
  onEdit: (address: CustomerAddress) => void;
  onDelete: (id: string) => void;
  onDefault: (id: string) => void;
}) {
  const { t } = useLocale();
  if (!addresses.length) {
    return (
      <div className={styles.empty}>
        <h2>{t("addressesEmptyTitle")}</h2>
        <p>{t("addressesEmptyBody")}</p>
      </div>
    );
  }
  return (
    <ul className={styles.list}>
      {addresses.map((address) => (
        <AddressCard
          key={address.id}
          address={address}
          busy={busyId === address.id}
          disabled={disabled || (busyId !== "" && busyId !== address.id)}
          onEdit={() => onEdit(address)}
          onDelete={() => onDelete(address.id)}
          onDefault={() => onDefault(address.id)}
        />
      ))}
    </ul>
  );
}
