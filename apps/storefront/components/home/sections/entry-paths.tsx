"use client";

import { ButtonLink } from "@/components/ui/button-link";
import { PageSection } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";

export function EntryPaths() {
  const { t } = useLocale();
  return (
    <PageSection
      className="grid gap-6 md:grid-cols-2"
      aria-label={t("entryPathsAria")}
    >
      {[
        {
          index: t("ownPathIndex"),
          title: t("ownPathTitle"),
          body: t("ownPathBody"),
          href: "/products",
          action: t("viewWorks"),
        },
        {
          index: t("createPathIndex"),
          title: t("createPathTitle"),
          body: t("createPathBody"),
          href: "/studio",
          action: t("designMine"),
        },
      ].map((path) => (
        <article
          key={path.href}
          className="flex min-h-[440px] flex-col justify-end gap-4 bg-rad-paper p-[clamp(2rem,5vw,3rem)] max-md:min-h-[360px]"
        >
          <span className="text-caption tracking-[0.12em] text-rad-clay">
            {path.index}
          </span>
          <h2 className="m-0 text-h3 font-normal">{path.title}</h2>
          <p className="m-0 max-w-md text-prose text-rad-muted">{path.body}</p>
          <ButtonLink href={path.href} outline>
            {path.action}
          </ButtonLink>
        </article>
      ))}
    </PageSection>
  );
}
