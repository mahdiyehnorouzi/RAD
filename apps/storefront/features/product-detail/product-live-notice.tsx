"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@rad/types";
import { StateNotice } from "@/components/ui/state-panel";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { useCountdown } from "@/hooks/use-countdown";
import { formatCountdown, isGoneStatus } from "@/lib/catalog/product-status";
import type { LiveProduct } from "./hooks";
import styles from "./product-live-notice.module.css";

/**
 * Tells the visitor what changed while they were on the page: withdrawn,
 * sold, reserved in someone else's bag, back on sale, or unknown (offline).
 */
export function ProductLiveNotice({
  product,
  live,
  inBag,
  reserved,
}: {
  product: Product;
  live: LiveProduct;
  inBag: boolean;
  reserved: boolean;
}) {
  const { t, locale, number } = useLocale();
  const firstStatus = useRef(product.status);
  const [wasHeld, setWasHeld] = useState(false);
  const remaining = useCountdown(reserved ? product.reservedUntil : null);
  const gone = !inBag && isGoneStatus(product.status);

  useEffect(() => {
    if (reserved || gone) setWasHeld(true);
  }, [reserved, gone]);

  const connection = !live.online ? (
    <StateNotice tone="error">
      <p>{t("liveOffline")}</p>
    </StateNotice>
  ) : live.failed ? (
    <StateNotice
      tone="error"
      action={
        <button
          type="button"
          className="state-action"
          onClick={() => void live.check()}
          disabled={live.checking}
        >
          {live.checking ? t("retrying") : t("retry")}
        </button>
      }
    >
      <p>{t("liveCheckFailed")}</p>
    </StateNotice>
  ) : null;

  let change = null;
  if (live.withdrawn) {
    change = (
      <StateNotice
        tone="error"
        action={<ButtonLink href="/products">{t("viewWorks")}</ButtonLink>}
      >
        <strong>{t("liveDeletedTitle")}</strong>
        <p>{t("liveDeletedBody")}</p>
      </StateNotice>
    );
  } else if (reserved) {
    change = (
      <StateNotice live="off">
        <strong>{t("liveReservedTitle")}</strong>
        <p>
          {t("liveReservedBody", {
            time: formatCountdown(remaining ?? 0, locale, number),
          })}
        </p>
      </StateNotice>
    );
  } else if (gone && firstStatus.current === "available") {
    change = (
      <StateNotice tone="error">
        <strong>{t("liveSoldTitle")}</strong>
        <p>{t("liveSoldBody")}</p>
      </StateNotice>
    );
  } else if (product.status === "available" && wasHeld && !inBag) {
    change = (
      <StateNotice>
        <strong>{t("liveReturnedTitle")}</strong>
      </StateNotice>
    );
  }

  if (!change && !connection) return null;
  return (
    <div className={styles.liveNotices}>
      {change}
      {connection}
    </div>
  );
}
