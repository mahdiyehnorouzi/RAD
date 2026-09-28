"use client";

import { ButtonLink } from "@/components/ui/button-link";
import { useLocale, type MessageKey } from "@/components/i18n";
import { StateScreen } from "./state-screen";

export function NotFoundState({
  title = "notFoundTitle",
  body = "notFoundBody",
  primary = { href: "/products", label: "backWorks" },
  secondary = { href: "/", label: "backHome" },
}: {
  title?: MessageKey;
  body?: MessageKey;
  primary?: { href: string; label: MessageKey };
  secondary?: { href: string; label: MessageKey };
}) {
  const { t } = useLocale();
  return (
    <StateScreen
      art="not-found"
      layout="split"
      as="h1"
      code={t("notFoundCode")}
      title={t(title)}
      body={<p>{t(body)}</p>}
      actions={
        <>
          <ButtonLink href={primary.href}>{t(primary.label)}</ButtonLink>
          <ButtonLink href={secondary.href} outline>
            {t(secondary.label)}
          </ButtonLink>
        </>
      }
    />
  );
}
