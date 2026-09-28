"use client";

import { LockKeyhole } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { StateScreen } from "./state-screen";

export function NoAccessState({ returnTo }: { returnTo?: string }) {
  const { t } = useLocale();
  const signIn = returnTo
    ? `/account?returnTo=${encodeURIComponent(returnTo)}`
    : "/account";
  return (
    <StateScreen
      art="no-access"
      layout="split"
      as="h1"
      title={t("noAccessTitle")}
      body={<p>{t("noAccessBody")}</p>}
      badge={<LockKeyhole aria-hidden="true" />}
      actions={
        <>
          <ButtonLink href={signIn}>{t("signInToAccount")}</ButtonLink>
          <ButtonLink href="/" outline>
            {t("backHome")}
          </ButtonLink>
        </>
      }
    />
  );
}
