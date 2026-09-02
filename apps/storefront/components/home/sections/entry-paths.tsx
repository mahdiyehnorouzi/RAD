"use client";

import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";

export function EntryPaths() {
  const { t } = useLocale();
  return (
    <section className="entry-paths" aria-label={t("entryPathsAria")}>
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
        <article key={path.href}>
          <span>{path.index}</span>
          <h2>{path.title}</h2>
          <p>{path.body}</p>
          <ButtonLink href={path.href} outline>
            {path.action}
          </ButtonLink>
        </article>
      ))}
    </section>
  );
}
