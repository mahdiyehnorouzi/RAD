"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "./button-link";
import { StatePanel } from "./state-panel";
import { useLocale, type MessageKey } from "@/components/i18n";

/** Body of an `error.tsx` boundary: explains the failure and retries the segment. */
export function RouteError({
  error,
  retry,
  title = "errorPageTitle",
  body = "errorPageBody",
  backHref = "/",
  backLabel = "goHome",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  title?: MessageKey;
  body?: MessageKey;
  backHref?: string;
  backLabel?: MessageKey;
}) {
  const { t } = useLocale();
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    console.error(error);
    setRetrying(false);
  }, [error]);

  useEffect(() => {
    if (!retrying) return undefined;
    const timer = window.setTimeout(() => setRetrying(false), 6000);
    return () => window.clearTimeout(timer);
  }, [retrying]);

  return (
    <section className="section">
      <StatePanel
        tone="error"
        as="h1"
        title={t(title)}
        actions={
          <>
            <button
              type="button"
              className="button"
              disabled={retrying}
              onClick={() => {
                setRetrying(true);
                retry();
              }}
            >
              {retrying ? t("retrying") : t("retry")}
            </button>
            <ButtonLink href={backHref} outline>
              {t(backLabel)}
            </ButtonLink>
          </>
        }
      >
        <p>{t(body)}</p>
        {error.digest ? (
          <p>
            <small dir="ltr">ref: {error.digest}</small>
          </p>
        ) : null}
      </StatePanel>
    </section>
  );
}
