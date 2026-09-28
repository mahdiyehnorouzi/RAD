"use client";

import { useEffect, useState } from "react";
import { RotateCw } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale, type MessageKey } from "@/components/i18n";
import type { StateLayout } from "./type";
import { StateScreen } from "./state-screen";

/** A failed load with a retry. Pass `retrying` when the caller owns the request state. */
export function ErrorState({
  error,
  onRetry,
  retrying,
  title = "errorPageTitle",
  body = "errorPageBody",
  back = { href: "/", label: "backHome" },
  layout = "split",
  as = layout === "split" ? "h1" : "h2",
}: {
  error?: Error & { digest?: string };
  onRetry: () => void;
  retrying?: boolean;
  title?: MessageKey;
  body?: MessageKey;
  back?: { href: string; label: MessageKey } | null;
  layout?: StateLayout;
  as?: "h1" | "h2";
}) {
  const { t } = useLocale();
  const [pending, setPending] = useState(false);
  const busy = retrying ?? pending;

  useEffect(() => {
    if (error) console.error(error);
    setPending(false);
  }, [error]);

  useEffect(() => {
    if (!pending) return undefined;
    const timer = window.setTimeout(() => setPending(false), 6000);
    return () => window.clearTimeout(timer);
  }, [pending]);

  return (
    <StateScreen
      art="error"
      layout={layout}
      tone="error"
      as={as}
      code={t("errorPageCode")}
      title={t(title)}
      body={
        <>
          <p>{t(body)}</p>
          {error?.digest ? (
            <p>
              <small dir="ltr">ref: {error.digest}</small>
            </p>
          ) : null}
        </>
      }
      actions={
        <>
          <button
            type="button"
            className="button"
            disabled={busy}
            aria-busy={busy}
            onClick={() => {
              setPending(true);
              onRetry();
            }}
          >
            <span>{busy ? t("retrying") : t("retry")}</span>
            <RotateCw className="state-screen-icon" aria-hidden="true" />
          </button>
          {back ? (
            <ButtonLink href={back.href} outline>
              {t(back.label)}
            </ButtonLink>
          ) : null}
        </>
      }
    />
  );
}
